package com.mycompany.food_order.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    private static final String URL =
            "jdbc:postgresql://ep-ancient-glitter-b30406cv"
            + ".c-4.ap-southeast-1.aws.neon.tech:5432"
            + "/neondb?sslmode=require";

    private static final String USER = "neondb_owner";

    private static final String PASSWORD = "npg_Kas4uZCh9NUF";

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}