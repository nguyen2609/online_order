package com.mycompany.food_order.service;

import com.mycompany.food_order.dao.OrderDAO;
import com.mycompany.food_order.dto.OrderRequest;
import java.sql.SQLException;

public class OrderService {

    private final OrderDAO orderDAO = new OrderDAO();

    public int createOrder(OrderRequest request) throws SQLException {

        if (request == null) {
            throw new IllegalArgumentException("Thiếu dữ liệu đơn hàng.");
        }

        if (request.getSessionId() == null
                || request.getSessionId() <= 0) {
            throw new IllegalArgumentException("sessionId phải lớn hơn 0.");
        }

        if (request.getItems() == null
                || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Đơn phải có ít nhất một món.");
        }

        for (OrderRequest.Item item : request.getItems()) {

            if (item == null) {
                throw new IllegalArgumentException("Món trong đơn không hợp lệ.");
            }

            if (item.getFoodId() == null || item.getFoodId() <= 0) {
                throw new IllegalArgumentException("foodId phải lớn hơn 0.");
            }

            if (item.getQuantity() == null || item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Số lượng phải lớn hơn 0.");
            }
        }

        return orderDAO.create(request);
    }
}