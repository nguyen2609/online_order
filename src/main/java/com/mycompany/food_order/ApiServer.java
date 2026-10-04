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
import java.io.InputStream;
import com.mycompany.food_order.controller.TableSessionHandler;
public class ApiServer {

    private static final Gson GSON = new Gson();
    private static final FoodDAO FOOD_DAO = new FoodDAO();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(
                new InetSocketAddress("0.0.0.0", 8080), 0
        );

        server.createContext("/api/foods", ApiServer::handleFoods);
        server.createContext("/api/orders", new OrderHandler());
        server.createContext("/kitchen.html", ApiServer::handleKitchenPage);
        server.createContext("/css/kitchen.css", ApiServer::handleKitchenCss);
        server.createContext("/js/kitchen.js", ApiServer::handleKitchenJs);
        server.createContext(
        "/menu.html",
        ApiServer::handleMenuPage
        );

        server.createContext(
        "/css/menu.css",
        ApiServer::handleMenuCss
        );

        server.createContext(
        "/js/menu.js",
        ApiServer::handleMenuJs
        );
        server.createContext(
        "/api/tables",
        new TableSessionHandler()
        );
        server.createContext(
        "/staff.html",
        ApiServer::handleStaffPage
        );

        server.createContext(
        "/css/staff.css",
        ApiServer::handleStaffCss
        );

server.createContext(
        "/js/staff.js",
        ApiServer::handleStaffJs
);
        server.createContext(
        "/images",
        ApiServer::handleImages
);
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
    private static void handleKitchenPage(HttpExchange exchange)
        throws IOException {

    serveStaticFile(
            exchange,
            "/static/kitchen.html",
            "text/html; charset=UTF-8"
    );
}

private static void handleKitchenCss(HttpExchange exchange)
        throws IOException {

    serveStaticFile(
            exchange,
            "/static/css/kitchen.css",
            "text/css; charset=UTF-8"
    );
}

private static void handleKitchenJs(HttpExchange exchange)
        throws IOException {

    serveStaticFile(
            exchange,
            "/static/js/kitchen.js",
            "application/javascript; charset=UTF-8"
    );
}
private static void serveStaticFile(
        HttpExchange exchange,
        String resourcePath,
        String contentType
) throws IOException {

    try (InputStream input =
                 ApiServer.class.getResourceAsStream(resourcePath)) {

        if (input == null) {
            sendJson(exchange, 404,
                    "{\"error\":\"File not found\"}");
            return;
        }

        byte[] bytes = input.readAllBytes();

        exchange.getResponseHeaders().set(
                "Content-Type",
                contentType
        );

        exchange.sendResponseHeaders(
                200,
                bytes.length
        );

        try (OutputStream output =
                     exchange.getResponseBody()) {

            output.write(bytes);
        }
    }
}
private static void handleMenuPage(HttpExchange exchange)
        throws IOException {

    serveStaticFile(
            exchange,
            "/static/menu.html",
            "text/html; charset=UTF-8"
    );
}

private static void handleMenuCss(HttpExchange exchange)
        throws IOException {

    serveStaticFile(
            exchange,
            "/static/css/menu.css",
            "text/css; charset=UTF-8"
    );
}

private static void handleMenuJs(HttpExchange exchange)
        throws IOException {

    serveStaticFile(
            exchange,
            "/static/js/menu.js",
            "application/javascript; charset=UTF-8"
    );
}
private static void handleStaffPage(HttpExchange exchange)
        throws IOException {

    serveStaticFile(
            exchange,
            "/static/staff.html",
            "text/html; charset=UTF-8"
    );
}

private static void handleStaffCss(HttpExchange exchange)
        throws IOException {

    serveStaticFile(
            exchange,
            "/static/css/staff.css",
            "text/css; charset=UTF-8"
    );
}

private static void handleStaffJs(HttpExchange exchange)
        throws IOException {

    serveStaticFile(
            exchange,
            "/static/js/staff.js",
            "application/javascript; charset=UTF-8"
    );
}
private static void handleImages(HttpExchange exchange)
        throws IOException {

    String path =
            exchange.getRequestURI().getPath();

    String resourcePath =
            "/static" + path;

    String contentType;

    if (path.endsWith(".webp")) {

        contentType = "image/webp";

    } else if (path.endsWith(".png")) {

        contentType = "image/png";

    } else if (path.endsWith(".jpg")
            || path.endsWith(".jpeg")) {

        contentType = "image/jpeg";

    } else {

        contentType = "application/octet-stream";
    }

    serveStaticFile(
            exchange,
            resourcePath,
            contentType
    );
}
}