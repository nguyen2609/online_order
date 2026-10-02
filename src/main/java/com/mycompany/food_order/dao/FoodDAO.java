package com.mycompany.food_order.dao;

import com.mycompany.food_order.model.Food;
import com.mycompany.food_order.config.DatabaseConnection;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class FoodDAO {

    public List<Food> findAll() throws SQLException {
        String sql =
                "SELECT id, name, price, available "
                + "FROM app.foods ORDER BY id";

        List<Food> foods = new ArrayList<>();

        try (
            Connection connection =
                    DatabaseConnection.getConnection();

            PreparedStatement statement =
                    connection.prepareStatement(sql);

            ResultSet result = statement.executeQuery()
        ) {
            while (result.next()) {
                Food food = new Food(
                        result.getInt("id"),
                        result.getString("name"),
                        result.getBigDecimal("price"),
                        result.getBoolean("available")
                );

                foods.add(food);
            }
        }

        return foods;
    }
}