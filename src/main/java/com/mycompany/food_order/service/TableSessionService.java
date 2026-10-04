package com.mycompany.food_order.service;

import com.mycompany.food_order.dao.TableSessionDAO;
import java.sql.SQLException;

public class TableSessionService {
    

    private final TableSessionDAO tableSessionDAO =
            new TableSessionDAO();

    public int getOpenSessionId(int tableNumber)
            throws SQLException {

        if (tableNumber <= 0) {
            throw new IllegalArgumentException(
                    "tableNumber phải lớn hơn 0."
            );
        }

        Integer sessionId =
                tableSessionDAO.findOpenSessionIdByTableNumber(
                        tableNumber
                );

        if (sessionId == null) {
            throw new IllegalArgumentException(
                    "Bàn không có session đang mở."
            );
        }

        return sessionId;
    }
    public int openSession(int tableNumber) throws SQLException {

    if (tableNumber <= 0) {
        throw new IllegalArgumentException(
                "tableNumber phải lớn hơn 0."
        );
    }

    Integer currentSession =
            tableSessionDAO.findOpenSessionIdByTableNumber(
                    tableNumber
            );

    if (currentSession != null) {
        throw new IllegalArgumentException(
                "Bàn đang có session mở."
        );
    }

    return tableSessionDAO.openSession(tableNumber);
}

public void closeSession(int tableNumber) throws SQLException {

    if (tableNumber <= 0) {
        throw new IllegalArgumentException(
                "tableNumber phải lớn hơn 0."
        );
    }

    boolean closed =
            tableSessionDAO.closeSession(tableNumber);

    if (!closed) {
        throw new IllegalArgumentException(
                "Bàn không có session đang mở."
        );
    }
}
}