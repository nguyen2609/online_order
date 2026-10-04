package com.mycompany.food_order.dao;

import com.mycompany.food_order.config.DatabaseConnection;
import com.mycompany.food_order.dto.BillResponse;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

public class BillDAO {

    public BillResponse findBillByTableNumber(int tableNumber)
            throws SQLException {

        String sql =
                "SELECT "
                + "s.id AS session_id, "
                + "t.table_number, "
                + "o.id AS order_id, "
                + "f.name AS food_name, "
                + "oi.quantity, "
                + "oi.unit_price "
                + "FROM app.dining_tables t "
                + "JOIN app.table_sessions s "
                + "ON s.table_id = t.id "
                + "AND s.closed_at IS NULL "
                + "LEFT JOIN app.orders o "
                + "ON o.session_id = s.id "
                + "AND o.status = 'COMPLETED' "
                + "LEFT JOIN app.order_items oi "
                + "ON oi.order_id = o.id "
                + "LEFT JOIN app.foods f "
                + "ON f.id = oi.food_id "
                + "WHERE t.table_number = ? "
                + "AND t.active = TRUE "
                + "ORDER BY o.id, oi.id";

        try (Connection connection =
                     DatabaseConnection.getConnection();
             PreparedStatement statement =
                     connection.prepareStatement(sql)) {

            statement.setInt(1, tableNumber);

            try (ResultSet result = statement.executeQuery()) {

                BillResponse bill = null;

                Map<Integer, BillResponse.OrderTotal> orderMap =
                        new LinkedHashMap<>();

                while (result.next()) {

                    // Tạo bill khi đọc được dòng đầu tiên
                    if (bill == null) {

                        bill = new BillResponse(
                                result.getInt("table_number"),
                                result.getInt("session_id")
                        );
                    }

                    int orderId =
                            result.getInt("order_id");

                    // Nếu chưa có COMPLETED order
                    if (result.wasNull()) {
                        continue;
                    }

                    // Tìm order hiện tại trong Map
                    BillResponse.OrderTotal order =
                            orderMap.get(orderId);

                    // Nếu chưa có thì tạo order mới
                    if (order == null) {

                        order =
                                new BillResponse.OrderTotal(
                                        orderId
                                );

                        orderMap.put(
                                orderId,
                                order
                        );
                    }

                    String foodName =
                            result.getString("food_name");

                    // Nếu order có item
                    if (foodName != null) {

                        int quantity =
                                result.getInt("quantity");

                        BigDecimal unitPrice =
                                result.getBigDecimal(
                                        "unit_price"
                                );

                        BillResponse.Item item =
                                new BillResponse.Item(
                                        foodName,
                                        quantity,
                                        unitPrice
                                );

                        order.addItem(item);
                    }
                }

                // Sau khi lấy hết item,
                // mới add các order vào bill
                if (bill != null) {

                    for (BillResponse.OrderTotal order
                            : orderMap.values()) {

                        bill.addOrder(order);
                    }
                }

                return bill;
            }
        }
    }
}