from datetime import datetime
from backend.models import db, Customer, Transaction, Payment, Notification

def recalculate_customer_balance(customer_id):
    """
    Recalculates a customer's total balance from scratch using the database transactions
    to guarantee consistency.
    Balance = Sum(credits) - Sum(payments)
    """
    customer = Customer.query.get(customer_id)
    if not customer:
        return None
        
    credits = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.customer_id == customer_id,
        Transaction.type == 'credit'
    ).scalar() or 0.0

    payments = db.session.query(db.func.sum(Transaction.amount)).filter(
        Transaction.customer_id == customer_id,
        Transaction.type == 'payment'
    ).scalar() or 0.0

    new_balance = max(0.0, round(float(credits - payments), 2))
    customer.current_balance = new_balance
    
    # Update status based on balance
    if new_balance == 0:
        customer.status = 'paid'
    else:
        # Check if customer has overdue transactions (older than 14 days)
        old_credit = Transaction.query.filter(
            Transaction.customer_id == customer_id,
            Transaction.type == 'credit'
        ).order_by(Transaction.created_at.asc()).first()
        
        if old_credit and (datetime.utcnow() - old_credit.created_at).days > 14:
            customer.status = 'overdue'
        else:
            customer.status = 'pending'
            
    customer.updated_at = datetime.utcnow()
    db.session.commit()
    return customer

def record_transaction(shop_id, customer_id, txn_type, amount, description='', item_name=None, quantity=None, unit=None, price_per_unit=None, payment_method='cash', reference_id=''):
    """
    Atomically records a transaction (credit or payment) and recalculates the balance.
    """
    if amount <= 0:
        raise ValueError("Transaction amount must be greater than zero.")
        
    customer = Customer.query.get(customer_id)
    if not customer:
        raise ValueError(f"Customer with ID {customer_id} does not exist.")

    txn = Transaction(
        shop_id=shop_id,
        customer_id=customer_id,
        type=txn_type,
        amount=round(float(amount), 2),
        description=description or ('Credit added' if txn_type == 'credit' else 'Payment received'),
        item_name=item_name,
        quantity=quantity,
        unit=unit,
        price_per_unit=price_per_unit,
        total_amount=round(float(amount), 2),
        created_at=datetime.utcnow()
    )
    db.session.add(txn)
    db.session.flush()

    if txn_type == 'payment':
        payment = Payment(
            shop_id=shop_id,
            customer_id=customer_id,
            transaction_id=txn.id,
            amount=round(float(amount), 2),
            payment_method=payment_method or 'cash',
            reference_id=reference_id or '',
            notes=description or 'Payment recorded',
            created_at=datetime.utcnow()
        )
        db.session.add(payment)

    # Recalculate customer balance
    db.session.commit()
    recalculate_customer_balance(customer_id)

    # Create in-app notification
    notif_title = "Payment Received" if txn_type == 'payment' else "Udhari Recorded"
    notif_msg = f"₹{amount:g} {'payment recorded for' if txn_type == 'payment' else 'Udhari added to'} {customer.name}."
    notif = Notification(
        shop_id=shop_id,
        title=notif_title,
        message=notif_msg,
        type='payment' if txn_type == 'payment' else 'udhari',
        read=False
    )
    db.session.add(notif)
    db.session.commit()

    return txn
