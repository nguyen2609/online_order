package com.mycompany.food_order.controller;

import com.google.gson.Gson;
import com.mycompany.food_order.dto.BillResponse;
import com.mycompany.food_order.service.BillService;
import com.mycompany.food_order.service.TableSessionService;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.SQLException;
import java.util.Map;

public class TableSessionHandler implements HttpHandler {

    private final Gson gson = new Gson();

    private final TableSessionService tableSessionService =
            new TableSessionService();

    private final BillService billService =
            new BillService();

    @Override
    public void handle(HttpExchange exchange)
            throws IOException {
        

        String path =
                exchange.getRequestURI().getPath();

        String method =
                exchange.getRequestMethod();
        if ("POST".equals(method)
        && path.matches("/api/tables/\\d+/open")) {
        handleOpen(exchange, path);
        return;
        }

        if ("PATCH".equals(method)
        && path.matches("/api/tables/\\d+/close")) {
        handleClose(exchange, path);
        return;
        }

        // GET /api/tables/{tableNumber}/session
        if ("GET".equals(method)
                && path.matches("/api/tables/\\d+/session")) {

            handleSession(exchange, path);
            return;
        }

        // GET /api/tables/{tableNumber}/bill
        if ("GET".equals(method)
                && path.matches("/api/tables/\\d+/bill")) {

            handleBill(exchange, path);
            return;
        }

        // Không khớp endpoint nào
        sendJson(
                exchange,
                404,
                Map.of("error", "Endpoint not found")
        );
    }

    private void handleSession(
            HttpExchange exchange,
            String path
    ) throws IOException {

        try {

            String[] parts = path.split("/");

            int tableNumber =
                    Integer.parseInt(parts[3]);

            int sessionId =
                    tableSessionService
                            .getOpenSessionId(tableNumber);

            sendJson(
                    exchange,
                    200,
                    Map.of(
                            "tableNumber",
                            tableNumber,
                            "sessionId",
                            sessionId
                    )
            );

        } catch (IllegalArgumentException e) {

            sendJson(
                    exchange,
                    400,
                    Map.of("error", e.getMessage())
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendJson(
                    exchange,
                    500,
                    Map.of(
                            "error",
                            "Không thể lấy session."
                    )
            );
        }
    }

    private void handleBill(
            HttpExchange exchange,
            String path
    ) throws IOException {

        try {

            String[] parts = path.split("/");

            int tableNumber =
                    Integer.parseInt(parts[3]);

            BillResponse bill =
                    billService.getBill(tableNumber);

            sendJson(
                    exchange,
                    200,
                    bill
            );

        } catch (IllegalArgumentException e) {

            sendJson(
                    exchange,
                    400,
                    Map.of("error", e.getMessage())
            );

        } catch (SQLException e) {

            e.printStackTrace();

            sendJson(
                    exchange,
                    500,
                    Map.of(
                            "error",
                            "Không thể tính hóa đơn."
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
    private void handleOpen(
        HttpExchange exchange,
        String path
) throws IOException {

    try {

        String[] parts = path.split("/");

        int tableNumber =
                Integer.parseInt(parts[3]);

        int sessionId =
                tableSessionService.openSession(tableNumber);

        sendJson(
                exchange,
                201,
                Map.of(
                        "message", "Mở bàn thành công",
                        "tableNumber", tableNumber,
                        "sessionId", sessionId
                )
        );

    } catch (IllegalArgumentException e) {

        sendJson(
                exchange,
                400,
                Map.of("error", e.getMessage())
        );

    } catch (SQLException e) {

        e.printStackTrace();

        sendJson(
                exchange,
                500,
                Map.of(
                        "error",
                        "Không thể mở bàn."
                )
        );
    }
}

private void handleClose(
        HttpExchange exchange,
        String path
) throws IOException {

    try {

        String[] parts = path.split("/");

        int tableNumber =
                Integer.parseInt(parts[3]);

        tableSessionService.closeSession(tableNumber);

        sendJson(
                exchange,
                200,
                Map.of(
                        "message", "Đóng bàn thành công",
                        "tableNumber", tableNumber
                )
        );

    } catch (IllegalArgumentException e) {

        sendJson(
                exchange,
                400,
                Map.of("error", e.getMessage())
        );

    } catch (SQLException e) {

        e.printStackTrace();

        sendJson(
                exchange,
                500,
                Map.of(
                        "error",
                        "Không thể đóng bàn."
                )
        );
    }
}
}