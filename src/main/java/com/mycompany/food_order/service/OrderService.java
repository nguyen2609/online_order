package com.mycompany.food_order.service;

import com.mycompany.food_order.dao.OrderDAO;
import com.mycompany.food_order.dto.OrderRequest;
import java.sql.SQLException;
import com.mycompany.food_order.dto.OrderResponse;
import java.util.List;

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
    public List<OrderResponse> getAllOrders() throws SQLException {
    return orderDAO.findAll();
}
    public void updateOrderStatus(int orderId, String status)
        throws SQLException {

    if (orderId <= 0) {
        throw new IllegalArgumentException(
                "orderId phải lớn hơn 0."
        );
    }

    if (status == null || status.isBlank()) {
        throw new IllegalArgumentException(
                "Thiếu status."
        );
    }

    String newStatus = status.toUpperCase();

    if (!newStatus.equals("PREPARED")
            && !newStatus.equals("COMPLETED")) {

        throw new IllegalArgumentException(
                "Status không hợp lệ."
        );
    }

    String currentStatus =
            orderDAO.findStatusById(orderId);

    if (currentStatus == null) {
        throw new IllegalArgumentException(
                "Không tìm thấy order."
        );
    }

    boolean validTransition =
            currentStatus.equals("PREPARED")
            && newStatus.equals("COMPLETED");

    if (!validTransition) {
        throw new IllegalArgumentException(
                "Không thể chuyển trạng thái từ "
                + currentStatus
                + " sang "
                + newStatus
        );
    }

    boolean updated =
            orderDAO.updateStatus(orderId, newStatus);

    if (!updated) {
        throw new IllegalArgumentException(
                "Không thể cập nhật order."
        );
    }
}
    public List<OrderResponse> getOrdersByStatus(String status)
        throws SQLException {

    if (status == null || status.isBlank()) {
        throw new IllegalArgumentException(
                "Thiếu status."
        );
    }

    String normalizedStatus = status.toUpperCase();

    if (!normalizedStatus.equals("PREPARED")
            && !normalizedStatus.equals("COMPLETED")) {

        throw new IllegalArgumentException(
                "Status không hợp lệ."
        );
    }

    return orderDAO.findByStatus(normalizedStatus);
}
   
}