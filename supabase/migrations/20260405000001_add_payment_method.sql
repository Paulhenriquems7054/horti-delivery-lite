-- Migration: Add payment_method to orders table
-- Created: 2026-04-05
-- Description: Adds payment method field to track how customer will pay (credit, debit, cash)

-- Add payment_method column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('credit', 'debit', 'cash'));

-- Add comment to explain the column
COMMENT ON COLUMN orders.payment_method IS 'Payment method chosen by customer: credit (cartão de crédito), debit (cartão de débito), cash (dinheiro)';

-- Create index for faster queries filtering by payment method
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method);
