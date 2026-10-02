package com.mycompany.food_order.dto;

import java.util.List;

public class OrderRequest {

    private Integer sessionId;
    private String note;
    private List<Item> items;

    public Integer getSessionId() {
        return sessionId;
    }

    public String getNote() {
        return note;
    }

    public List<Item> getItems() {
        return items;
    }

    public static class Item {

        private Integer foodId;
        private Integer quantity;
        private String note;

        public Integer getFoodId() {
            return foodId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public String getNote() {
            return note;
        }
    }
}