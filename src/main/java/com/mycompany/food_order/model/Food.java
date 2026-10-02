package com.mycompany.food_order.model;

import java.math.BigDecimal;

public class Food {

    private final int id;
    private final String name;
    private final BigDecimal price;
    private final boolean available;

    public Food(int id, String name,
                BigDecimal price, boolean available) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.available = available;
    }
}