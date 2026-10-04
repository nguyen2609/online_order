package com.mycompany.food_order.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BillResponse {

    private int tableNumber;
    private int sessionId;
    private List<OrderTotal> orders = new ArrayList<>();
    private BigDecimal totalAmount = BigDecimal.ZERO;

    public BillResponse(int tableNumber, int sessionId) {
        this.tableNumber = tableNumber;
        this.sessionId = sessionId;
    }

    public int getTableNumber() {
        return tableNumber;
    }

    public int getSessionId() {
        return sessionId;
    }

    public List<OrderTotal> getOrders() {
        return orders;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void addOrder(OrderTotal order) {
        orders.add(order);
        totalAmount = totalAmount.add(order.getTotal());
    }

    public static class OrderTotal {

        private int orderId;
        private BigDecimal total = BigDecimal.ZERO;
        private List<Item> items = new ArrayList<>();

        public OrderTotal(int orderId) {
            this.orderId = orderId;
        }

        public int getOrderId() {
            return orderId;
        }

        public BigDecimal getTotal() {
            return total;
        }

        public List<Item> getItems() {
            return items;
        }

        public void addItem(Item item) {

            items.add(item);

            total = total.add(
                    item.getItemTotal()
            );
        }
    }

    public static class Item {

        private String foodName;
        private int quantity;
        private BigDecimal unitPrice;
        private BigDecimal itemTotal;

        public Item(
                String foodName,
                int quantity,
                BigDecimal unitPrice
        ) {
            this.foodName = foodName;
            this.quantity = quantity;
            this.unitPrice = unitPrice;

            this.itemTotal =
                    unitPrice.multiply(
                            BigDecimal.valueOf(quantity)
                    );
        }

        public String getFoodName() {
            return foodName;
        }

        public int getQuantity() {
            return quantity;
        }

        public BigDecimal getUnitPrice() {
            return unitPrice;
        }

        public BigDecimal getItemTotal() {
            return itemTotal;
        }
    }
}