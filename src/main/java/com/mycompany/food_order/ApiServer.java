package com.mycompany.food_order;
import com.mycompany.food_order.controller.OrderHandler;
import com.mycompany.food_order.model.Food;
import com.mycompany.food_order.dao.FoodDAO;
import com.google.gson.Gson;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.List;

public class ApiServer {

    private static final Gson GSON = new Gson();
    private static final FoodDAO FOOD_DAO = new FoodDAO();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(
                new InetSocketAddress("localhost", 8080), 0
        );

        server.createContext("/api/foods", ApiServer::handleFoods);
        server.createContext("/api/orders", new OrderHandler());
        server.start();

        System.out.println("API dang chay:");
        System.out.println("http://localhost:8080/api/foods");
        System.out.println("http://localhost:8080/api/orders");
    }

    private static void handleFoods(HttpExchange exchange)
            throws IOException {

        // Chi chap nhan dung duong dan nay.
        if (!"/api/foods".equals(exchange.getRequestURI().getPath())) {
            sendJson(exchange, 404,
                    "{\"error\":\"Endpoint not found\"}");
            return;
        }

        // API nay chi ho tro phuong thuc GET.
        if (!"GET".equals(exchange.getRequestMethod())) {
            exchange.getResponseHeaders().set("Allow", "GET");
            sendJson(exchange, 405,
                    "{\"error\":\"Only GET is supported\"}");
            return;
        }

        try {
            List<Food> foods = FOOD_DAO.findAll();

            String json = GSON.toJson(foods);

            sendJson(exchange, 200, json);

        } catch (SQLException e) {
            e.printStackTrace();

            sendJson(exchange, 500,
                    "{\"error\":\"Cannot load foods from database\"}");
        }
    }

    private static void sendJson(
            HttpExchange exchange, int statusCode, String json
    ) throws IOException {

        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);

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