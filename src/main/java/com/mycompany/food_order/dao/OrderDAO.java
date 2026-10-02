package com.mycompany.food_order.dao;

import com.mycompany.food_order.config.DatabaseConnection;
import com.mycompany.food_order.dto.OrderRequest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

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
}