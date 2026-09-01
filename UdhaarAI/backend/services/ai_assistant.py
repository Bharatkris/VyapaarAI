import re
from datetime import datetime, timedelta
from backend.models import db, Customer, Transaction, Payment, Product

def ask_assistant(query_text, shop_id=1):
    q = query_text.strip().lower()
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    start_of_month = datetime(now.year, now.month, 1)

    # 1. Check: Customer specific balance or transactions
    # e.g., "Show me Ramesh ka balance", "Ramesh ka kitna baaki hai", "Ramesh's balance"
    for cust in Customer.query.filter_by(shop_id=shop_id).all():
        first_name = cust.name.split()[0].lower()
        if cust.name.lower() in q or (len(first_name) >= 3 and re.search(rf'\b{first_name}\b', q)):
            recent_cust_txns = Transaction.query.filter_by(customer_id=cust.id).order_by(Transaction.created_at.desc()).limit(3).all()
            txn_summary = ""
            if recent_cust_txns:
                txn_summary = "<br><br><strong>Recent activity:</strong><br>" + "<br>".join([
                    f"• {t.type.title()}: ₹{t.amount:g} ({t.description or 'No desc'}) — {t.created_at.strftime('%d %b')}"
                    for t in recent_cust_txns
                ])
            
            status_tag = f"<span class='badge {cust.status}'>{cust.status.title()}</span>"
            return (
                f"<strong>{cust.name}</strong> currently has an outstanding balance of <strong>₹{cust.current_balance:,.2f}</strong> "
                f"({status_tag}). Phone: {cust.phone}.{txn_summary}"
            )

    # 2. Check: Who owes more than X (e.g. "Who owes me more than 5000", "5000 se jyada baki")
    amount_thresh_match = re.search(r'(?:more than|above|jyada|greater than|>)\s*(?:₹|rs\.?)?\s*(\d+)', q) or \
                          re.search(r'(\d+)\s*(?:se jyada|rupaye se jyada)', q)
    if amount_thresh_match:
        threshold = float(amount_thresh_match.group(1))
        debtors = Customer.query.filter(Customer.shop_id == shop_id, Customer.current_balance >= threshold).order_by(Customer.current_balance.desc()).all()
        if debtors:
            debtor_list = "<br>".join([f"• <strong>{d.name}</strong> — ₹{d.current_balance:,.2f} ({d.status.title()})" for d in debtors])
            return f"Found <strong>{len(debtors)} customers</strong> who owe ₹{threshold:,.0f} or more:<br><br>{debtor_list}"
        else:
            return f"No customers currently owe ₹{threshold:,.0f} or more. All pending balances are below this amount."

    # 3. Check: Who owes the most? / Top debtors / Top outstanding
    if any(phrase in q for phrase in ['who owes me the most', 'who owes the most', 'top debtor', 'highest balance', 'sabse jyada baki', 'highest udhari']):
        top_custs = Customer.query.filter(Customer.shop_id == shop_id, Customer.current_balance > 0).order_by(Customer.current_balance.desc()).limit(5).all()
        if top_custs:
            top_list = "<br>".join([f"• <strong>{c.name}</strong>: ₹{c.current_balance:,.2f} ({c.phone})" for c in top_custs])
            return f"The customers with the highest outstanding balance are:<br><br>{top_list}"
        else:
            return "Good news! You have no outstanding customer balances right now."

    # 4. Check: Today's transactions / How much given or received today
    if 'today' in q or 'aaj' in q or 'आज' in q:
        today_credits = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.shop_id == shop_id,
            Transaction.type == 'credit',
            Transaction.created_at >= start_of_today
        ).scalar() or 0.0
        
        today_payments = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.shop_id == shop_id,
            Transaction.type == 'payment',
            Transaction.created_at >= start_of_today
        ).scalar() or 0.0

        today_count = Transaction.query.filter(
            Transaction.shop_id == shop_id,
            Transaction.created_at >= start_of_today
        ).count()

        return (
            f"<strong>Today's Ledger Summary:</strong><br>"
            f"• Udhari given today: <strong>₹{today_credits:,.2f}</strong><br>"
            f"• Payments collected today: <strong>₹{today_payments:,.2f}</strong><br>"
            f"• Total transactions: <strong>{today_count}</strong>"
        )

    # 5. Check: Monthly Udhari / This month
    if 'this month' in q or 'month' in q or 'mahine' in q or 'महिना' in q:
        month_credits = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.shop_id == shop_id,
            Transaction.type == 'credit',
            Transaction.created_at >= start_of_month
        ).scalar() or 0.0
        
        month_payments = db.session.query(db.func.sum(Transaction.amount)).filter(
            Transaction.shop_id == shop_id,
            Transaction.type == 'payment',
            Transaction.created_at >= start_of_month
        ).scalar() or 0.0

        month_txns_count = Transaction.query.filter(
            Transaction.shop_id == shop_id,
            Transaction.created_at >= start_of_month
        ).count()

        return (
            f"For this month ({now.strftime('%B %Y')}):<br>"
            f"• Total Udhari given: <strong>₹{month_credits:,.2f}</strong><br>"
            f"• Total Payments received: <strong>₹{month_payments:,.2f}</strong><br>"
            f"• Total transactions: <strong>{month_txns_count}</strong>"
        )

    # 6. Check: Overdue / Not paid for 30 days
    if 'overdue' in q or '30 days' in q or 'not paid' in q or 'pending' in q:
        overdue_custs = Customer.query.filter(Customer.shop_id == shop_id, Customer.status == 'overdue').all()
        if overdue_custs:
            overdue_list = "<br>".join([f"• <strong>{c.name}</strong> — ₹{c.current_balance:,.2f} ({c.phone})" for c in overdue_custs])
            return f"You have <strong>{len(overdue_custs)} overdue customers</strong> requiring follow-up:<br><br>{overdue_list}<br><br>Tip: Go to the <strong>Reminders</strong> tab to send WhatsApp reminders in one tap."
        else:
            return "No overdue customers found. All customer accounts are either paid or up to date!"

    # 7. Check: Product price or stock inquiry
    for prod in Product.query.filter_by(shop_id=shop_id).all():
        if prod.name.lower() in q:
            return f"<strong>{prod.name}</strong> ({prod.category}): Selling price is <strong>₹{prod.price:g}/{prod.unit}</strong>. Current stock: <strong>{prod.stock:g} {prod.unit}</strong>."

    # General overview response
    total_outstanding = db.session.query(db.func.sum(Customer.current_balance)).filter(Customer.shop_id == shop_id).scalar() or 0.0
    total_custs = Customer.query.filter_by(shop_id=shop_id).count()
    return (
        f"You have <strong>{total_custs} customers</strong> with a total outstanding balance of <strong>₹{total_outstanding:,.2f}</strong> across your shop.<br><br>"
        "You can ask me questions like:<br>"
        "• <em>“Who owes me more than ₹5,000?”</em><br>"
        "• <em>“Show Ramesh Patil's balance”</em><br>"
        "• <em>“How much did I receive today?”</em><br>"
        "• <em>“Who is overdue?”</em>"
    )
