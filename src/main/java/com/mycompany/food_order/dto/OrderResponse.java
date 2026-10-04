package com.mycompany.food_order.dto;

import java.util.ArrayList;
import java.util.List;

public class OrderResponse {

    private int orderId;
    private int sessionId;
    private int tableNumber;
    private String status;
    private String note;
    private List<Item> items = new ArrayList<>();

    public OrderResponse(
            int orderId,
            int sessionId,
            int tableNumber,
            String status,
            String note
    ) {
        this.orderId = orderId;
        this.sessionId = sessionId;
        this.tableNumber = tableNumber;
        this.status = status;
        this.note = note;
    }

    public int getOrderId() {
        return orderId;
    }

    public int getSessionId() {
        return sessionId;
    }

    public int getTableNumber() {
        return tableNumber;
    }

    public String getStatus() {
        return status;
    }

    public String getNote() {
        return note;
    }

    public List<Item> getItems() {
        return items;
    }

    public void addItem(Item item) {
        items.add(item);
    }

    public static class Item {

        private int foodId;
        private String foodName;
        private int quantity;
        private double unitPrice;
        private String note;

        public Item(
                int foodId,
                String foodName,
                int quantity,
                double unitPrice,
                String note
        ) {
            this.foodId = foodId;
            this.foodName = foodName;
            this.quantity = quantity;
            this.unitPrice = unitPrice;
            this.note = note;
        }

        public int getFoodId() {
            return foodId;
        }

        public String getFoodName() {
            return foodName;
        }

        public int getQuantity() {
            return quantity;
        }

        public double getUnitPrice() {
            return unitPrice;
        }

        public String getNote() {
            return note;
        }
    }
}