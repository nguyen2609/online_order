package com.mycompany.food_order.dao;

import com.mycompany.food_order.config.DatabaseConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class TableSessionDAO {
    public int openSession(int tableNumber) throws SQLException {

    String sql =
            "INSERT INTO app.table_sessions (table_id, opened_at) "
            + "SELECT id, CURRENT_TIMESTAMP "
            + "FROM app.dining_tables "
            + "WHERE table_number = ? "
            + "AND active = TRUE "
            + "RETURNING id";

    try (Connection connection = DatabaseConnection.getConnection();
         PreparedStatement statement = connection.prepareStatement(sql)) {

        statement.setInt(1, tableNumber);

        try (ResultSet result = statement.executeQuery()) {

            if (result.next()) {
                return result.getInt("id");
            }

            throw new IllegalArgumentException(
                    "Không tìm thấy bàn hoặc bàn không hoạt động."
            );
        }
    }
}

public boolean closeSession(int tableNumber) throws SQLException {

    String sql =
            "UPDATE app.table_sessions s "
            + "SET closed_at = CURRENT_TIMESTAMP "
            + "FROM app.dining_tables t "
            + "WHERE s.table_id = t.id "
            + "AND t.table_number = ? "
            + "AND s.closed_at IS NULL";

    try (Connection connection = DatabaseConnection.getConnection();
         PreparedStatement statement = connection.prepareStatement(sql)) {

        statement.setInt(1, tableNumber);

        int updatedRows = statement.executeUpdate();

        return updatedRows == 1;
    }
}

    public Integer findOpenSessionIdByTableNumber(int tableNumber)
            throws SQLException {

        String sql =
                "SELECT s.id "
                + "FROM app.table_sessions s "
                + "JOIN app.dining_tables t ON t.id = s.table_id "
                + "WHERE t.table_number = ? "
                + "AND t.active = TRUE "
                + "AND s.closed_at IS NULL";

        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, tableNumber);

            try (ResultSet result = statement.executeQuery()) {

                if (result.next()) {
                    return result.getInt("id");
                }

                return null;
            }
        }
    }
}