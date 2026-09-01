from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Shop(db.Model):
    __tablename__ = 'shops'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False, default='Bharat General Store')
    owner_name = db.Column(db.String(120), nullable=False, default='Bharat')
    phone = db.Column(db.String(20), nullable=False, default='9876543210')
    address = db.Column(db.String(255), nullable=True, default='JSPM Market, Pune')
    gstin = db.Column(db.String(50), nullable=True, default='')
    currency = db.Column(db.String(10), default='INR')
    default_language = db.Column(db.String(20), default='hi')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customers = db.relationship('Customer', backref='shop', cascade='all, delete-orphan', lazy=True)
    products = db.relationship('Product', backref='shop', cascade='all, delete-orphan', lazy=True)
    transactions = db.relationship('Transaction', backref='shop', cascade='all, delete-orphan', lazy=True)
    bills = db.relationship('Bill', backref='shop', cascade='all, delete-orphan', lazy=True)
    reminders = db.relationship('Reminder', backref='shop', cascade='all, delete-orphan', lazy=True)
    notifications = db.relationship('Notification', backref='shop', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'owner_name': self.owner_name,
            'phone': self.phone,
            'address': self.address,
            'gstin': self.gstin,
            'currency': self.currency,
            'default_language': self.default_language
        }

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, default='bharat')
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False, default=1)
    name = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(255), nullable=True, default='')
    email = db.Column(db.String(120), nullable=True, default='')
    notes = db.Column(db.Text, nullable=True, default='')
    current_balance = db.Column(db.Float, default=0.0) # > 0 means customer owes shop (udhari)
    status = db.Column(db.String(30), default='paid') # 'paid', 'pending', 'overdue'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    transactions = db.relationship('Transaction', backref='customer', cascade='all, delete-orphan', lazy=True, order_by='desc(Transaction.created_at)')
    payments = db.relationship('Payment', backref='customer', cascade='all, delete-orphan', lazy=True)
    bills = db.relationship('Bill', backref='customer', cascade='all, delete-orphan', lazy=True)
    reminders = db.relationship('Reminder', backref='customer', cascade='all, delete-orphan', lazy=True)

    def to_dict(self, include_summary=True):
        total_udhari = sum(t.amount for t in self.transactions if t.type == 'credit')
        total_payments = sum(t.amount for t in self.transactions if t.type == 'payment')
        last_txn = self.transactions[0] if self.transactions else None
        
        last_str = 'Never'
        if last_txn:
            diff = (datetime.utcnow() - last_txn.created_at).total_seconds()
            if diff < 120:
                last_str = 'Just now'
            elif diff < 3600:
                last_str = f"{int(diff // 60)} min ago"
            elif diff < 86400:
                last_str = f"{int(diff // 3600)} hr ago"
            elif diff < 172800:
                last_str = 'Yesterday'
            else:
                last_str = f"{int(diff // 86400)} days ago"

        res = {
            'id': self.id,
            'shop_id': self.shop_id,
            'name': self.name,
            'phone': self.phone,
            'address': self.address or '',
            'email': self.email or '',
            'notes': self.notes or '',
            'balance': round(float(self.current_balance), 2),
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'last': last_str
        }
        if include_summary:
            res['total_udhari'] = round(total_udhari, 2)
            res['total_payments'] = round(total_payments, 2)
        return res

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False, default=1)
    name = db.Column(db.String(120), nullable=False)
    sku = db.Column(db.String(50), nullable=True, default='')
    category = db.Column(db.String(80), nullable=False, default='Grocery')
    price = db.Column(db.Float, nullable=False, default=0.0)
    stock = db.Column(db.Float, nullable=False, default=0.0)
    unit = db.Column(db.String(20), nullable=False, default='kg') # 'kg', 'L', 'pack', 'pc', 'gram'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'name': self.name,
            'sku': self.sku or '',
            'category': self.category,
            'price': round(float(self.price), 2),
            'stock': round(float(self.stock), 2),
            'unit': self.unit,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False, default=1)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False) # 'credit' (udhari) or 'payment' (debit)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String(255), nullable=True, default='')
    item_name = db.Column(db.String(120), nullable=True, default='')
    quantity = db.Column(db.Float, nullable=True)
    unit = db.Column(db.String(20), nullable=True, default='')
    price_per_unit = db.Column(db.Float, nullable=True)
    total_amount = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    payment_record = db.relationship('Payment', backref='transaction', uselist=False, cascade='all, delete-orphan')

    def to_dict(self):
        diff = (datetime.utcnow() - self.created_at).total_seconds() if self.created_at else 0
        if diff < 120:
            time_str = 'Just now'
        elif diff < 3600:
            time_str = f"{int(diff // 60)} min ago"
        elif diff < 86400:
            time_str = f"{int(diff // 3600)} hr ago"
        elif diff < 172800:
            time_str = 'Yesterday'
        else:
            time_str = self.created_at.strftime('%d %b, %I:%M %p') if self.created_at else ''

        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_name': self.customer.name if self.customer else 'Unknown',
            'name': self.customer.name if self.customer else 'Unknown',
            'type': self.type, # 'credit' or 'payment'
            'amount': round(float(self.amount), 2),
            'description': self.description or ('Credit added' if self.type == 'credit' else 'Payment received'),
            'desc': self.description or (f"{self.item_name} • {self.quantity} {self.unit}" if self.item_name and self.quantity else ('Credit added' if self.type == 'credit' else 'Payment received')),
            'item_name': self.item_name or '',
            'quantity': self.quantity,
            'unit': self.unit or '',
            'price_per_unit': self.price_per_unit,
            'total_amount': self.total_amount or self.amount,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'time': time_str
        }

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False, default=1)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transactions.id'), nullable=True)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(30), default='cash') # 'cash', 'upi', 'bank', 'other'
    reference_id = db.Column(db.String(100), nullable=True, default='')
    notes = db.Column(db.String(255), nullable=True, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        diff = (datetime.utcnow() - self.created_at).total_seconds() if self.created_at else 0
        if diff < 120:
            time_str = 'Just now'
        elif diff < 3600:
            time_str = f"{int(diff // 60)} min ago"
        elif diff < 86400:
            time_str = f"{int(diff // 3600)} hr ago"
        else:
            time_str = self.created_at.strftime('%d %b %Y, %I:%M %p') if self.created_at else ''

        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'customer_id': self.customer_id,
            'customer_name': self.customer.name if self.customer else 'Unknown',
            'transaction_id': self.transaction_id,
            'amount': round(float(self.amount), 2),
            'payment_method': self.payment_method,
            'reference_id': self.reference_id or '',
            'notes': self.notes or '',
            'time': time_str,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Bill(db.Model):
    __tablename__ = 'bills'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False, default=1)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    bill_number = db.Column(db.String(50), nullable=False, unique=True)
    subtotal = db.Column(db.Float, nullable=False, default=0.0)
    discount = db.Column(db.Float, nullable=False, default=0.0)
    total_amount = db.Column(db.Float, nullable=False, default=0.0)
    payment_status = db.Column(db.String(30), default='udhari') # 'draft', 'paid', 'partially_paid', 'udhari'
    notes = db.Column(db.Text, nullable=True, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    items = db.relationship('BillItem', backref='bill', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        diff = (datetime.utcnow() - self.created_at).total_seconds() if self.created_at else 0
        if diff < 120:
            time_str = 'Just now'
        elif diff < 3600:
            time_str = f"{int(diff // 60)} min ago"
        elif diff < 86400:
            time_str = f"{int(diff // 3600)} hr ago"
        else:
            time_str = self.created_at.strftime('%d %b %Y') if self.created_at else ''

        return {
            'id': self.id,
            'bill_number': self.bill_number,
            'customer_id': self.customer_id,
            'customer_name': self.customer.name if self.customer else 'Unknown',
            'customer_phone': self.customer.phone if self.customer else '',
            'customer_address': self.customer.address if self.customer else '',
            'subtotal': round(float(self.subtotal), 2),
            'discount': round(float(self.discount), 2),
            'total_amount': round(float(self.total_amount), 2),
            'payment_status': self.payment_status,
            'notes': self.notes or '',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'time': time_str,
            'items': [item.to_dict() for item in self.items]
        }

class BillItem(db.Model):
    __tablename__ = 'bill_items'
    
    id = db.Column(db.Integer, primary_key=True)
    bill_id = db.Column(db.Integer, db.ForeignKey('bills.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    item_name = db.Column(db.String(120), nullable=False)
    quantity = db.Column(db.Float, nullable=False, default=1.0)
    unit = db.Column(db.String(20), default='pc')
    price = db.Column(db.Float, nullable=False, default=0.0)
    total = db.Column(db.Float, nullable=False, default=0.0)

    def to_dict(self):
        return {
            'id': self.id,
            'bill_id': self.bill_id,
            'product_id': self.product_id,
            'item_name': self.item_name,
            'quantity': float(self.quantity),
            'unit': self.unit,
            'price': round(float(self.price), 2),
            'total': round(float(self.total), 2)
        }

class Reminder(db.Model):
    __tablename__ = 'reminders'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False, default=1)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='pending') # 'pending', 'sent', 'completed'
    notes = db.Column(db.String(255), nullable=True, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'shop_id': self.shop_id,
            'customer_id': self.customer_id,
            'customer_name': self.customer.name if self.customer else 'Unknown',
            'customer_phone': self.customer.phone if self.customer else '',
            'amount': round(float(self.amount), 2),
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'notes': self.notes or '',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False, default=1)
    title = db.Column(db.String(150), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(30), default='system') # 'overdue', 'payment', 'udhari', 'reminder', 'system'
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        diff = (datetime.utcnow() - self.created_at).total_seconds() if self.created_at else 0
        if diff < 120:
            time_str = 'Just now'
        elif diff < 3600:
            time_str = f"{int(diff // 60)} min ago"
        elif diff < 86400:
            time_str = f"{int(diff // 3600)} hr ago"
        else:
            time_str = self.created_at.strftime('%d %b') if self.created_at else ''

        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'read': self.read,
            'time': time_str,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Setting(db.Model):
    __tablename__ = 'settings'
    
    id = db.Column(db.Integer, primary_key=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('shops.id'), nullable=False, default=1)
    key = db.Column(db.String(80), nullable=False, unique=True)
    value = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'key': self.key,
            'value': self.value
        }
