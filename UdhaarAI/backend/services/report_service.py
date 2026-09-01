from datetime import datetime, timedelta
from sqlalchemy import func
from backend.models import db, Customer, Transaction, Payment, Reminder

def get_dashboard_summary(shop_id=1):
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    start_of_month = datetime(now.year, now.month, 1)

    # 1. Total Outstanding (Sum of customer balances)
    total_outstanding = db.session.query(func.sum(Customer.current_balance)).filter(
        Customer.shop_id == shop_id
    ).scalar() or 0.0

    # 2. Total Udhari Ever & This Month
    total_udhari_all = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.shop_id == shop_id,
        Transaction.type == 'credit'
    ).scalar() or 0.0

    total_udhari_month = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.shop_id == shop_id,
        Transaction.type == 'credit',
        Transaction.created_at >= start_of_month
    ).scalar() or 0.0

    # 3. Received Today
    received_today = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.shop_id == shop_id,
        Transaction.type == 'payment',
        Transaction.created_at >= start_of_today
    ).scalar() or 0.0

    payments_today_count = db.session.query(func.count(Transaction.id)).filter(
        Transaction.shop_id == shop_id,
        Transaction.type == 'payment',
        Transaction.created_at >= start_of_today
    ).scalar() or 0

    # 4. Given Today (Credit today)
    given_today = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.shop_id == shop_id,
        Transaction.type == 'credit',
        Transaction.created_at >= start_of_today
    ).scalar() or 0.0

    credits_today_count = db.session.query(func.count(Transaction.id)).filter(
        Transaction.shop_id == shop_id,
        Transaction.type == 'credit',
        Transaction.created_at >= start_of_today
    ).scalar() or 0

    # 5. Customer counts
    total_customers = Customer.query.filter_by(shop_id=shop_id).count()
    pending_customers = Customer.query.filter(Customer.shop_id == shop_id, Customer.current_balance > 0).count()
    overdue_customers = Customer.query.filter(Customer.shop_id == shop_id, Customer.status == 'overdue').count()

    # 6. Recent transactions
    recent_txns = Transaction.query.filter_by(shop_id=shop_id).order_by(Transaction.created_at.desc()).limit(8).all()

    # 7. Reminders due
    active_reminders = Reminder.query.filter(
        Reminder.shop_id == shop_id,
        Reminder.status != 'completed'
    ).order_by(Reminder.due_date.asc()).limit(5).all()

    return {
        'total_outstanding': round(total_outstanding, 2),
        'total_udhari': round(total_udhari_all, 2),
        'total_udhari_month': round(total_udhari_month, 2),
        'received_today': round(received_today, 2),
        'payments_today_count': payments_today_count,
        'given_today': round(given_today, 2),
        'credits_today_count': credits_today_count,
        'total_customers': total_customers,
        'pending_customers': pending_customers,
        'overdue_customers': overdue_customers,
        'recent_transactions': [t.to_dict() for t in recent_txns],
        'reminders': [r.to_dict() for r in active_reminders]
    }

def get_reports_data(shop_id=1, period='month'):
    now = datetime.utcnow()
    
    if period == 'today':
        start_date = datetime(now.year, now.month, now.day)
    elif period == 'week':
        start_date = now - timedelta(days=7)
    elif period == 'month':
        start_date = now - timedelta(days=30)
    elif period == 'year':
        start_date = now - timedelta(days=365)
    else:
        start_date = now - timedelta(days=30)

    # Aggregates in period
    total_credit = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.shop_id == shop_id,
        Transaction.type == 'credit',
        Transaction.created_at >= start_date
    ).scalar() or 0.0

    total_payment = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.shop_id == shop_id,
        Transaction.type == 'payment',
        Transaction.created_at >= start_date
    ).scalar() or 0.0

    total_outstanding = db.session.query(func.sum(Customer.current_balance)).filter(
        Customer.shop_id == shop_id
    ).scalar() or 0.0

    # Top customers by balance
    top_customers = Customer.query.filter(
        Customer.shop_id == shop_id,
        Customer.current_balance > 0
    ).order_by(Customer.current_balance.desc()).limit(6).all()

    # Time series breakdown (e.g. 10 intervals)
    intervals = []
    num_bars = 10
    interval_delta = (now - start_date) / num_bars if now > start_date else timedelta(days=1)
    
    for i in range(num_bars):
        b_start = start_date + (i * interval_delta)
        b_end = start_date + ((i + 1) * interval_delta)
        
        c_amt = db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.shop_id == shop_id,
            Transaction.type == 'credit',
            Transaction.created_at >= b_start,
            Transaction.created_at < b_end
        ).scalar() or 0.0

        p_amt = db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.shop_id == shop_id,
            Transaction.type == 'payment',
            Transaction.created_at >= b_start,
            Transaction.created_at < b_end
        ).scalar() or 0.0

        intervals.append({
            'label': b_start.strftime('%d %b'),
            'credit': round(c_amt, 2),
            'payment': round(p_amt, 2),
            'total': round(c_amt + p_amt, 2)
        })

    # Outstanding mix breakdown percentages
    all_active_cust = Customer.query.filter_by(shop_id=shop_id).all()
    credit_cust_count = sum(1 for c in all_active_cust if c.current_balance > 0 and c.status != 'overdue')
    overdue_cust_count = sum(1 for c in all_active_cust if c.status == 'overdue')
    paid_cust_count = sum(1 for c in all_active_cust if c.current_balance == 0)
    total_c = max(1, len(all_active_cust))

    mix = {
        'credit_pct': round((credit_cust_count / total_c) * 100, 1),
        'overdue_pct': round((overdue_cust_count / total_c) * 100, 1),
        'paid_pct': round((paid_cust_count / total_c) * 100, 1)
    }

    return {
        'period': period,
        'total_credit': round(total_credit, 2),
        'total_payment': round(total_payment, 2),
        'total_outstanding': round(total_outstanding, 2),
        'top_customers': [c.to_dict() for c in top_customers],
        'intervals': intervals,
        'mix': mix
    }
