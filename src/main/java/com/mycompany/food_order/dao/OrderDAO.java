package com.mycompany.food_order.dao;

import com.mycompany.food_order.config.DatabaseConnection;
import com.mycompany.food_order.dto.OrderRequest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import com.mycompany.food_order.dto.OrderResponse;
import java.util.ArrayList;
import java.util.List;

public class OrderDAO {

    public int create(OrderRequest request) throws SQLException {
        String sessionSql =
                "SELECT s.id "
                + "FROM app.table_sessions s "
                + "JOIN app.dining_tables t ON t.id = s.table_id "
                + "WHERE s.id = ? "
                + "AND s.closed_at IS NULL "
                + "AND t.active = TRUE "
                + "FOR SHARE OF s, t";

        String orderSql =
                "INSERT INTO app.orders (session_id, note) "
                + "VALUES (?, ?) RETURNING id";

        String itemSql =
                "INSERT INTO app.order_items "
                + "(order_id, food_id, quantity, unit_price, note) "
                + "SELECT ?, id, ?, price, ? "
                + "FROM app.foods "
                + "WHERE id = ? AND available = TRUE";

        try (Connection connection = DatabaseConnection.getConnection()) {

            // Gom toàn bộ lần đặt đơn vào một transaction.
            connection.setAutoCommit(false);

            try {
                // Kiểm tra phiên bàn còn mở và bàn đang hoạt động.
                try (PreparedStatement statement =
                        connection.prepareStatement(sessionSql)) {

                    statement.setInt(1, request.getSessionId());

                    try (ResultSet result = statement.executeQuery()) {
                        if (!result.next()) {
                            throw new IllegalArgumentException(
                                    "Phiên bàn không tồn tại, đã đóng "
                                    + "hoặc bàn không hoạt động."
                            );
                        }
                    }
                }

                // Tạo đơn và lấy ID do database sinh ra.
                int orderId;

                try (PreparedStatement statement =
                        connection.prepareStatement(orderSql)) {

                    statement.setInt(1, request.getSessionId());
                    statement.setString(2, request.getNote());

                    try (ResultSet result = statement.executeQuery()) {
                        if (!result.next()) {
                            throw new SQLException("Không lấy được ID đơn.");
                        }

                        orderId = result.getInt("id");
                    }
                }

                // Thêm từng món, lấy giá trực tiếp từ bảng foods.
                try (PreparedStatement statement =
                        connection.prepareStatement(itemSql)) {

                    for (OrderRequest.Item item : request.getItems()) {
                        statement.setInt(1, orderId);
                        statement.setInt(2, item.getQuantity());
                        statement.setString(3, item.getNote());
                        statement.setInt(4, item.getFoodId());

                        int insertedRows = statement.executeUpdate();

                        if (insertedRows != 1) {
                            throw new IllegalArgumentException(
                                    "Món có ID " + item.getFoodId()
                                    + " không tồn tại hoặc đã ngừng bán."
                            );
                        }
                    }
                }

                // Chỉ lưu khi mọi bước đều thành công.
                connection.commit();
                return orderId;

            } catch (SQLException | RuntimeException e) {
                // Có lỗi thì hủy toàn bộ lần lưu đơn.
                try {
                    connection.rollback();
                } catch (SQLException rollbackError) {
                    e.addSuppressed(rollbackError);
                }

                throw e;
            }
        }
    }
    public List<OrderResponse> findAll() throws SQLException {

    String sql =
            "SELECT "
            + "o.id AS order_id, "
            + "o.session_id, "
            + "o.status, "
            + "o.note AS order_note, "
            + "t.table_number, "
            + "oi.food_id, "
            + "f.name AS food_name, "
            + "oi.quantity, "
            + "oi.unit_price, "
            + "oi.note AS item_note "
            + "FROM app.orders o "
            + "JOIN app.table_sessions s ON s.id = o.session_id "
            + "JOIN app.dining_tables t ON t.id = s.table_id "
            + "LEFT JOIN app.order_items oi ON oi.order_id = o.id "
            + "LEFT JOIN app.foods f ON f.id = oi.food_id "
            + "ORDER BY o.id DESC, oi.id";

    List<OrderResponse> orders = new ArrayList<>();

    try (Connection connection = DatabaseConnection.getConnection();
         PreparedStatement statement = connection.prepareStatement(sql);
         ResultSet result = statement.executeQuery()) {

        OrderResponse currentOrder = null;
        int currentOrderId = -1;

        while (result.next()) {

            int orderId = result.getInt("order_id");

            if (orderId != currentOrderId) {

                currentOrder = new OrderResponse(
                        orderId,
                        result.getInt("session_id"),
                        result.getInt("table_number"),
                        result.getString("status"),
                        result.getString("order_note")
                );

                orders.add(currentOrder);
                currentOrderId = orderId;
            }

            int foodId = result.getInt("food_id");

            if (!result.wasNull()) {

                OrderResponse.Item item =
                        new OrderResponse.Item(
                                foodId,
                                result.getString("food_name"),
                                result.getInt("quantity"),
                                result.getDouble("unit_price"),
                                result.getString("item_note")
                        );

                currentOrder.addItem(item);
            }
        }
    }

    return orders;
}
    public List<OrderResponse> findByStatus(String status)
        throws SQLException {

    String sql =
            "SELECT "
            + "o.id AS order_id, "
            + "o.session_id, "
            + "o.status, "
            + "o.note AS order_note, "
            + "t.table_number, "
            + "oi.food_id, "
            + "f.name AS food_name, "
            + "oi.quantity, "
            + "oi.unit_price, "
            + "oi.note AS item_note "
            + "FROM app.orders o "
            + "JOIN app.table_sessions s ON s.id = o.session_id "
            + "JOIN app.dining_tables t ON t.id = s.table_id "
            + "LEFT JOIN app.order_items oi ON oi.order_id = o.id "
            + "LEFT JOIN app.foods f ON f.id = oi.food_id "
            + "WHERE o.status = ? "
            + "ORDER BY o.id DESC, oi.id";

    List<OrderResponse> orders = new ArrayList<>();

    try (Connection connection = DatabaseConnection.getConnection();
         PreparedStatement statement = connection.prepareStatement(sql)) {

        statement.setString(1, status);

        try (ResultSet result = statement.executeQuery()) {

            OrderResponse currentOrder = null;
            int currentOrderId = -1;

            while (result.next()) {

                int orderId = result.getInt("order_id");

                if (orderId != currentOrderId) {

                    currentOrder = new OrderResponse(
                            orderId,
                            result.getInt("session_id"),
                            result.getInt("table_number"),
                            result.getString("status"),
                            result.getString("order_note")
                    );

                    orders.add(currentOrder);
                    currentOrderId = orderId;
                }

                int foodId = result.getInt("food_id");

                if (!result.wasNull()) {

                    OrderResponse.Item item =
                            new OrderResponse.Item(
                                    foodId,
                                    result.getString("food_name"),
                                    result.getInt("quantity"),
                                    result.getDouble("unit_price"),
                                    result.getString("item_note")
                            );

                    currentOrder.addItem(item);
                }
            }
        }
    }

    return orders;
}
public boolean updateStatus(int orderId, String status) throws SQLException {

    String sql =
            "UPDATE app.orders "
            + "SET status = ? "
            + "WHERE id = ?";

    try (Connection connection = DatabaseConnection.getConnection();
         PreparedStatement statement = connection.prepareStatement(sql)) {

        statement.setString(1, status);
        statement.setInt(2, orderId);

        int updatedRows = statement.executeUpdate();

        return updatedRows == 1;
    }
}
public String findStatusById(int orderId) throws SQLException {

    String sql =
            "SELECT status "
            + "FROM app.orders "
            + "WHERE id = ?";

    try (Connection connection = DatabaseConnection.getConnection();
         PreparedStatement statement = connection.prepareStatement(sql)) {

        statement.setInt(1, orderId);

        try (ResultSet result = statement.executeQuery()) {

            if (result.next()) {
                return result.getString("status");
            }

            return null;
        }
    }
}
    
}