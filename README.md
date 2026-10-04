# Online Food Ordering System

## About

Online Food Ordering System is a simple web-based restaurant ordering application built with Java, PostgreSQL, JDBC, HTML, CSS, and JavaScript.

The system allows customers to order food by table, kitchen staff to manage orders, and restaurant staff to view bills and close table sessions.

The project follows a simple MVC / 3-tier architecture and does not use Spring Boot or ORM.

## Features

### Customer
- Open menu by table number
- View food name, image, and price
- Select quantity
- Add notes
- Add food to cart
- View cart total
- Submit order

### Kitchen
- View orders with `PREPARED` status
- View food items in each order
- Mark orders as `COMPLETED`

### Staff
- Select table
- View current table session
- View completed orders
- View food item prices and quantities
- View total bill
- Complete payment
- Close current table session

### Table Session
- Each table can have multiple sessions over time
- A new session is created for a new customer
- A session is closed after payment

## Technologies

- Java
- Maven
- PostgreSQL
- Neon PostgreSQL
- JDBC
- Gson
- Java HttpServer
- HTML
- CSS
- JavaScript
- Apache NetBeans

## Architecture

The project follows a simple 3-tier structure:

Frontend  
HTML / CSS / JavaScript  
↓  
Controller / Handler  
↓  
Service  
↓  
DAO  
↓  
JDBC  
↓  
PostgreSQL  

Main packages:

- `controller`: Handles HTTP requests
- `service`: Contains business logic
- `dao`: Executes SQL queries
- `dto`: Request and response objects
- `model`: Data models
- `config`: Database connection

## How to Run

### 1. Clone the repository

`git clone https://github.com/nguyen2609/online_order.git`

### 2. Open the project

Open Apache NetBeans and select:

File → Open Project → `online_order`

NetBeans may display the project name as `food_order` because the Maven artifact name is `food_order`.

### 3. Build the project

Right-click the project and select:

Clean and Build

Expected result:

`BUILD SUCCESS`

### 4. Run the server

Run:

`ApiServer.java`

The server runs on:

`http://localhost:8080`

## Application URLs

### Customer Menu

`http://localhost:8080/menu.html?table=1`

Other tables:

- `http://localhost:8080/menu.html?table=2`
- `http://localhost:8080/menu.html?table=3`
- `http://localhost:8080/menu.html?table=4`
- `http://localhost:8080/menu.html?table=5`

### Kitchen

`http://localhost:8080/kitchen.html`

### Staff

`http://localhost:8080/staff.html`

## Database

The project uses PostgreSQL hosted on Neon.

Main tables:

- `categories`
- `dining_tables`
- `table_sessions`
- `foods`
- `orders`
- `order_items`

Main relationship flow:

dining_tables → table_sessions → orders → order_items → foods

A physical table can have multiple sessions over time.

Example:

Table 1 → Session 10 → Customer A → Payment → Session 10 closed

Table 1 → Session 15 → Customer B

## Main Workflow

Customer opens menu  
↓  
Current table session is loaded or created  
↓  
Customer submits order  
↓  
Order status = `PREPARED`  
↓  
Kitchen receives order  
↓  
Kitchen marks order `COMPLETED`  
↓  
Staff views bill  
↓  
Customer pays  
↓  
Table session is closed  

## Access from Another Device

The server is configured to run on:

`0.0.0.0:8080`

This allows other devices on the same network to access the application.

Find the IPv4 address of the computer running the server:

`ipconfig`

Example:

`192.168.1.20`

Then another device can open:

`http://192.168.1.20:8080/menu.html?table=1`

The IPv4 address depends on the computer and network.

## Project Structure

- `src/main/java/com/mycompany/food_order/`
  - `config/`
  - `controller/`
  - `dao/`
  - `dto/`
  - `model/`
  - `service/`
  - `ApiServer.java`
- `src/main/resources/static/`
  - `menu.html`
  - `kitchen.html`
  - `staff.html`
  - `css/`
  - `js/`
  - `images/`

## Common Error

If you see:

`java.net.BindException: Address already in use`

port `8080` is already being used.

Stop the old server or process before running the project again.

## Authors

Java OOP / Database Course Project
