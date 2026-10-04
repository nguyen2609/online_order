package com.mycompany.food_order.controller;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.mycompany.food_order.dto.OrderRequest;
import com.mycompany.food_order.dto.OrderResponse;
import com.mycompany.food_order.dto.OrderStatusRequest;
import com.mycompany.food_order.service.OrderService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

public class OrderHandler implements HttpHandler {

    private final Gson gson = new Gson();
    private final OrderService orderService = new OrderService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {

        String path = exchange.getRequestURI().getPath();
        String method = exchange.getRequestMethod();

        // POST /api/orders
        // GET  /api/orders
        if ("/api/orders".equals(path)) {

            if ("POST".equals(method)) {
                handlePost(exchange);
                return;
            }

            if ("GET".equals(method)) {
                handleGet(exchange);
                return;
            }

            exchange.getResponseHeaders().set(
                    "Allow",
                    "GET, POST"
            );

            sendJson(exchange, 405,
                    Map.of(
                            "error",
                            "Only GET and POST are supported"
                    )
            );
            return;
        }

        // PATCH /api/orders/{id}/status
        if ("PATCH".equals(method)
                && path.matches("/api/orders/\\d+/status")) {

            handlePatchStatus(exchange, path);
            return;
        }

        // URL không tồn tại
        sendJson(exchange, 404,
                Map.of("error", "Endpoint not found"));
    }

    private void handlePost(HttpExchange exchange)
            throws IOException {

        int orderId;

        try {

            String body = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
            );

            OrderRequest request =
                    gson.fromJson(body, OrderRequest.class);

            orderId =
                    orderService.createOrder(request);

        } catch (JsonParseException e) {

            sendJson(exchange, 400,
                    Map.of(
                            "error",
                            "JSON không hợp lệ."
                    )
            );
            return;

        } catch (IllegalArgumentException e) {

            sendJson(exchange, 400,
                    Map.of(
                            "error",
                            e.getMessage()
                    )
            );
            return;

        } catch (SQLException e) {

            e.printStackTrace();

            sendJson(exchange, 500,
                    Map.of(
                            "error",
                            "Không thể lưu đơn vào database."
                    )
            );
            return;
        }

        sendJson(exchange, 201,
                Map.of(
                        "message",
                        "Đặt món thành công",
                        "orderId",
                        orderId,
                        "status",
                        "NEW"
                )
        );
    }

   private void handleGet(HttpExchange exchange)
        throws IOException {

    try {

        String query =
                exchange.getRequestURI().getQuery();

        List<OrderResponse> orders;

        if (query == null || query.isBlank()) {

            orders = orderService.getAllOrders();

        } else if (query.startsWith("status=")) {

            String status =
                    query.substring("status=".length());

            orders =
                    orderService.getOrdersByStatus(status);

        } else {

            sendJson(exchange, 400,
                    Map.of(
                            "error",
                            "Query parameter không hợp lệ."
                    )
            );
            return;
        }

        sendJson(exchange, 200, orders);

    } catch (IllegalArgumentException e) {

        sendJson(exchange, 400,
                Map.of(
                        "error",
                        e.getMessage()
                )
        );

    } catch (SQLException e) {

        e.printStackTrace();

        sendJson(exchange, 500,
                Map.of(
                        "error",
                        "Không thể lấy danh sách đơn hàng."
                )
        );
    }
}

    private void handlePatchStatus(
            HttpExchange exchange,
            String path
    ) throws IOException {

        try {

            String[] parts = path.split("/");

            int orderId =
                    Integer.parseInt(parts[3]);

            String body = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
            );

            OrderStatusRequest request =
                    gson.fromJson(
                            body,
                            OrderStatusRequest.class
                    );

            orderService.updateOrderStatus(
                    orderId,
                    request.getStatus()
            );

            sendJson(exchange, 200,
                    Map.of(
                            "message",
                            "Cập nhật trạng thái thành công",
                            "orderId",
                            orderId,
                            "status",
                            request.getStatus().toUpperCase()
                    )
            );

        } catch (JsonParseException e) {

            sendJson(exchange, 400,
                    Map.of(
                            "error",
                            "JSON không hợp lệ."
                    )
            );

        } catch (IllegalArgumentException e) {

            sendJson(exchange, 400,
                    Map.of(
                            "error",
                            e.getMessage()
                    )
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendJson(exchange, 500,
                    Map.of(
                            "error",
                            "Không thể cập nhật trạng thái."
                    )
            );
        }
    }

    private void sendJson(
            HttpExchange exchange,
            int statusCode,
            Object data
    ) throws IOException {

        byte[] bytes =
                gson.toJson(data)
                        .getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
                "Content-Type",
                "application/json; charset=UTF-8"
        );

        exchange.sendResponseHeaders(
                statusCode,
                bytes.length
        );

        try (OutputStream output =
                     exchange.getResponseBody()) {

            output.write(bytes);

        } finally {
            exchange.close();
        }
    }
}