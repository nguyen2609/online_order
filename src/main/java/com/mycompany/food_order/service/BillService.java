package com.mycompany.food_order.service;

import com.mycompany.food_order.dao.BillDAO;
import com.mycompany.food_order.dto.BillResponse;

import java.sql.SQLException;

public class BillService {

    private final BillDAO billDAO = new BillDAO();

    public BillResponse getBill(int tableNumber)
            throws SQLException {

        if (tableNumber <= 0) {
            throw new IllegalArgumentException(
                    "tableNumber phải lớn hơn 0."
            );
        }

        BillResponse bill =
                billDAO.findBillByTableNumber(tableNumber);

        if (bill == null) {
            throw new IllegalArgumentException(
                    "Bàn không có session đang mở."
            );
        }

        return bill;
    }
}