package com.mycompany.food_order.controller;

import com.google.gson.Gson;
import com.google.gson.JsonParseException;
import com.mycompany.food_order.dto.OrderRequest;
import com.mycompany.food_order.service.OrderService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Map;

public class OrderHandler implements HttpHandler {

    private final Gson gson = new Gson();
    private final OrderService orderService = new OrderService();

    @Override
    public void handle(HttpExchange exchange) throws IOException {

        if (!"/api/orders".equals(exchange.getRequestURI().getPath())) {
            sendJson(exchange, 404,
                    Map.of("error", "Endpoint not found"));
            return;
        }

        if (!"POST".equals(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Allow", "POST");

            sendJson(exchange, 405,
                    Map.of("error", "Only POST is supported"));
            return;
        }

        int orderId;

        try {
            String body = new String(
                    exchange.getRequestBody().readAllBytes(),
                    StandardCharsets.UTF_8
            );

            OrderRequest request =
                    gson.fromJson(body, OrderRequest.class);

            orderId = orderService.createOrder(request);

        } catch (JsonParseException e) {
            sendJson(exchange, 400,
                    Map.of("error", "JSON không hợp lệ."));
            return;

        } catch (IllegalArgumentException e) {
            sendJson(exchange, 400,
                    Map.of("error", e.getMessage()));
            return;

        } catch (SQLException e) {
            e.printStackTrace();

            sendJson(exchange, 500,
                    Map.of("error", "Không thể lưu đơn vào database."));
            return;
        }

        sendJson(exchange, 201, Map.of(
                "message", "Đặt món thành công",
                "orderId", orderId,
                "status", "NEW"
        ));
    }

    private void sendJson(
            HttpExchange exchange, int statusCode, Object data
    ) throws IOException {

        byte[] bytes = gson.toJson(data)
                .getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders().set(
                "Content-Type", "application/json; charset=UTF-8"
        );

        exchange.sendResponseHeaders(statusCode, bytes.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        } finally {
            exchange.close();
        }
    }
}