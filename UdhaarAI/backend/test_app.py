import unittest
import json
from backend.app import create_app
from backend.models import db, Customer, Transaction, Payment, Bill, Product, Reminder, Shop

class UdhaarAITestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_01_health(self):
        res = self.client.get('/api/health')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['ok'])
        self.assertEqual(data['status'], 'healthy')

    def test_02_dashboard_summary(self):
        res = self.client.get('/api/dashboard')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['ok'])
        self.assertIn('total_outstanding', data['data'])
        self.assertIn('recent_transactions', data['data'])

    def test_03_customer_crud_and_balance(self):
        # 1. Create Customer
        res = self.client.post('/api/customers', json={
            'name': 'Kavita Sharma',
            'phone': '9812345670',
            'address': 'Kothrud, Pune',
            'opening_balance': 1500.0,
            'notes': 'Test customer account'
        })
        self.assertEqual(res.status_code, 201)
        cust_id = res.get_json()['customer']['id']

        # 2. Verify Customer & Balance
        res = self.client.get(f'/api/customers/{cust_id}')
        self.assertEqual(res.status_code, 200)
        cdata = res.get_json()['customer']
        self.assertEqual(cdata['name'], 'Kavita Sharma')
        self.assertEqual(cdata['balance'], 1500.0)
        self.assertEqual(cdata['status'], 'pending')

        # 3. Add Udhari Transaction
        res = self.client.post('/api/transactions', json={
            'customer_id': cust_id,
            'amount': 500.0,
            'action': 'udhari',
            'description': 'Sugar & Tea'
        })
        self.assertEqual(res.status_code, 201)

        # Verify new balance = 2000
        res = self.client.get(f'/api/customers/{cust_id}')
        self.assertEqual(res.get_json()['customer']['balance'], 2000.0)

        # 4. Record Payment
        res = self.client.post('/api/payments', json={
            'customer_id': cust_id,
            'amount': 2000.0,
            'payment_method': 'upi',
            'notes': 'Settled via GooglePay'
        })
        self.assertEqual(res.status_code, 201)

        # Verify new balance = 0 and status is paid
        res = self.client.get(f'/api/customers/{cust_id}')
        cdata = res.get_json()['customer']
        self.assertEqual(cdata['balance'], 0.0)
        self.assertEqual(cdata['status'], 'paid')

        # 5. Delete Customer
        res = self.client.delete(f'/api/customers/{cust_id}')
        self.assertEqual(res.status_code, 200)

    def test_04_voice_parser_nlp(self):
        # Hindi sentence with amount & udhari
        res = self.client.post('/api/voice/process', json={
            'text': 'Ramesh Patil ne 500 rupaye udhar liye'
        })
        self.assertEqual(res.status_code, 200)
        parsed = res.get_json()['parsed']
        self.assertEqual(parsed['customer'], 'Ramesh Patil')
        self.assertEqual(parsed['amount'], 500.0)
        self.assertEqual(parsed['action'], 'udhari')

        # Marathi / Hinglish payment
        res = self.client.post('/api/voice/process', json={
            'text': 'Suresh Traders ne 700 rupaye payment diya'
        })
        self.assertEqual(res.status_code, 200)
        parsed = res.get_json()['parsed']
        self.assertEqual(parsed['customer'], 'Suresh Traders')
        self.assertEqual(parsed['amount'], 700.0)
        self.assertEqual(parsed['action'], 'payment')

        # Quantity & item unit rate
        res = self.client.post('/api/voice/process', json={
            'text': 'Ramesh ko 2 kilo sugar 100 rupaye kilo ke hisaab se udhar diya'
        })
        self.assertEqual(res.status_code, 200)
        parsed = res.get_json()['parsed']
        self.assertEqual(parsed['customer'], 'Ramesh Patil')
        self.assertEqual(parsed['quantity'], 2.0)
        self.assertEqual(parsed['unit'], 'kg')
        self.assertEqual(parsed['total'], 200.0)
        self.assertEqual(parsed['action'], 'udhari')

    def test_05_voice_confirm_edited_flow_suresh_traders(self):
        """Test exact scenario required by User: Edit Ramesh 500 -> Suresh Traders 750 -> Confirm"""
        with self.app.app_context():
            suresh = Customer.query.filter(Customer.name.ilike('%Suresh Traders%')).first()
            if not suresh:
                suresh = Customer(shop_id=1, name='Suresh Traders', phone='9876500000', current_balance=1250.0, status='pending')
                db.session.add(suresh)
                db.session.commit()
            initial_balance = suresh.current_balance

        # Send POST /api/transactions with exact payload format
        res = self.client.post('/api/transactions', json={
            'name': 'Suresh Traders',
            'amount': 750,
            'action': 'udhari',
            'description': 'Voice transaction'
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertTrue(data['ok'])
        self.assertIn('message', data)
        self.assertEqual(data['transaction']['amount'], 750.0)

        # Verify Suresh Traders' balance increased by 750
        with self.app.app_context():
            suresh_updated = Customer.query.filter(Customer.name.ilike('%Suresh Traders%')).first()
            self.assertEqual(suresh_updated.current_balance, initial_balance + 750.0)

    def test_06_ai_assistant_queries(self):
        res = self.client.post('/api/assistant/chat', json={
            'message': 'Who owes me more than 5000?'
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn('Rahul Shah', res.get_json()['reply'])

        res = self.client.post('/api/assistant/chat', json={
            'message': 'Show Ramesh Patil ka balance'
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn('Ramesh Patil', res.get_json()['reply'])

    def test_07_bill_generation_and_print_data(self):
        with self.app.app_context():
            cust = Customer.query.first()
            prod = Product.query.first()
            cust_id = cust.id
            prod_id = prod.id
            prod_name = prod.name
            prod_unit = prod.unit
            prod_price = prod.price
            initial_stock = prod.stock

        res = self.client.post('/api/bills', json={
            'customer_id': cust_id,
            'discount': 50.0,
            'payment_status': 'udhari',
            'items': [{
                'product_id': prod_id,
                'item_name': prod_name,
                'quantity': 2.0,
                'unit': prod_unit,
                'price': prod_price
            }]
        })
        self.assertEqual(res.status_code, 201)
        bill_data = res.get_json()['bill']
        self.assertTrue(bill_data['bill_number'].startswith('UD-'))
        self.assertEqual(len(bill_data['items']), 1)

        with self.app.app_context():
            prod_updated = Product.query.get(prod_id)
            self.assertEqual(prod_updated.stock, initial_stock - 2.0)

        # Verify bill fetch with shop profile
        res = self.client.get(f"/api/bills/{bill_data['id']}")
        self.assertEqual(res.status_code, 200)
        self.assertIn('shop', res.get_json()['bill'])

    def test_08_global_search(self):
        res = self.client.get('/api/search?q=Ramesh')
        self.assertEqual(res.status_code, 200)
        results = res.get_json()['results']
        self.assertTrue(any(c['name'] == 'Ramesh Patil' for c in results['customers']))

    def test_09_reports_aggregation(self):
        res = self.client.get('/api/reports?period=month')
        self.assertEqual(res.status_code, 200)
        rdata = res.get_json()['data']
        self.assertIn('total_credit', rdata)
        self.assertIn('total_payment', rdata)
        self.assertIn('intervals', rdata)
        self.assertIn('mix', rdata)

    def test_10_validation_error_responses(self):
        # Empty name
        res = self.client.post('/api/transactions', json={'name': '', 'amount': 100, 'action': 'udhari'})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()['ok'])

        # Invalid amount
        res = self.client.post('/api/transactions', json={'name': 'Ramesh', 'amount': 0, 'action': 'udhari'})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()['ok'])

        # Negative amount
        res = self.client.post('/api/transactions', json={'name': 'Ramesh', 'amount': -50, 'action': 'udhari'})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()['ok'])

        # Invalid action
        res = self.client.post('/api/transactions', json={'name': 'Ramesh', 'amount': 100, 'action': 'invalid_action'})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()['ok'])

    def test_11_auth_login_valid_credentials(self):
        res = self.client.post('/api/auth/login', json={
            'username': 'bharat',
            'password': 'admin123'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['ok'])
        self.assertIn('token', data)
        self.assertEqual(data['user']['username'], 'bharat')

    def test_12_auth_login_invalid_credentials(self):
        # Wrong password
        res = self.client.post('/api/auth/login', json={
            'username': 'bharat',
            'password': 'wrongpassword'
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertFalse(data['ok'])

        # Non-existent user
        res = self.client.post('/api/auth/login', json={
            'username': 'nonexistent_user',
            'password': 'admin123'
        })
        self.assertEqual(res.status_code, 401)
        data = res.get_json()
        self.assertFalse(data['ok'])

    def test_13_auth_login_validation_errors(self):
        # Missing username
        res = self.client.post('/api/auth/login', json={
            'username': '',
            'password': 'admin123'
        })
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()['ok'])

        # Missing password
        res = self.client.post('/api/auth/login', json={
            'username': 'bharat',
            'password': ''
        })
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()['ok'])

    def test_14_auth_me_and_logout(self):
        # Unauthorized access without token
        res = self.client.get('/api/auth/me')
        self.assertEqual(res.status_code, 401)

        # Authorized access with token
        res = self.client.get('/api/auth/me', headers={'Authorization': 'Bearer test_token'})
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()['ok'])

        # Logout
        res = self.client.post('/api/auth/logout')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()['ok'])

    def test_15_voice_no_unsafe_fallback(self):
        # Empty speech text -> 400 error
        res = self.client.post('/api/voice/process', json={'text': ''})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()['ok'])

        # Whitespace speech text -> 400 error
        res = self.client.post('/api/voice/process', json={'text': '    '})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(res.get_json()['ok'])

        # Text with amount but no customer name -> customer must be None (never default to Ramesh Patil)
        res = self.client.post('/api/voice/process', json={'text': '500 rupaye udhar diye'})
        self.assertEqual(res.status_code, 200)
        parsed = res.get_json()['parsed']
        self.assertIsNone(parsed['customer'])
        self.assertEqual(parsed['amount'], 500.0)

        # Text with customer name but no amount -> amount must be 0.0 (never default to 500)
        res = self.client.post('/api/voice/process', json={'text': 'Amit Kumar ko udhari diya'})
        self.assertEqual(res.status_code, 200)
        parsed = res.get_json()['parsed']
        self.assertEqual(parsed['customer'], 'Amit Kumar')
        self.assertEqual(parsed['amount'], 0.0)

if __name__ == '__main__':
    unittest.main()

