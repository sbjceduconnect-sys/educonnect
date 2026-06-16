from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import api_success, api_error
from core.case import convert_dict_keys, camel_to_snake
from .models import Book, BookTransaction
from .serializers import BookSerializer, BookTransactionSerializer

class BookListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Book.objects.all()
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return api_success(data=BookSerializer(qs, many=True).data)

    def post(self, request):
        from core.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
        s = BookSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Book created.", status=201)
        return api_error("Validation failed.", errors=s.errors)


class BookDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return api_error("Book not found.", status=404)
        return api_success(data=BookSerializer(obj).data)

    def put(self, request, pk):
        from core.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
        obj = self._get(pk)
        if not obj:
            return api_error("Book not found.", status=404)
        s = BookSerializer(obj, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return api_success(data=s.data, message="Book updated.")
        return api_error("Validation failed.", errors=s.errors)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        from core.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
        obj = self._get(pk)
        if not obj:
            return api_error("Book not found.", status=404)
        obj.delete()
        return api_success(message="Book deleted.", status=200)


class BookIssueView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from core.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
            
        data = convert_dict_keys(request.data, camel_to_snake)
        book_id = data.get('book_id')
        user_id = data.get('user_id')
        
        if not book_id or not user_id:
            return api_error("book_id and user_id are required.", status=400)
            
        try:
            book = Book.objects.get(pk=book_id)
        except Book.DoesNotExist:
            return api_error("Book not found.", status=404)
            
        if book.available_copies <= 0:
            return api_error("No copies of this book are currently available.", status=400)
            
        # Issue book
        book.available_copies -= 1
        book.save()
        
        due_date = date.today() + timedelta(days=14)
        txn = BookTransaction.objects.create(
            book=book,
            student_id=user_id,
            due_date=due_date,
            status='issued'
        )
        return api_success(data=BookTransactionSerializer(txn).data, message="Book issued successfully.", status=201)


class BookReturnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, transaction_id):
        from core.permissions import IsAdmin
        if not IsAdmin().has_permission(request, self):
            return api_error("Permission denied.", status=403)
            
        try:
            txn = BookTransaction.objects.get(pk=transaction_id)
        except BookTransaction.DoesNotExist:
            return api_error("Transaction not found.", status=404)
            
        if txn.status == 'returned':
            return api_error("Book is already returned.", status=400)
            
        # Update transaction
        txn.return_date = date.today()
        txn.status = 'returned'
        
        # Calculate fine (₹5 per day)
        if txn.return_date > txn.due_date:
            days_late = (txn.return_date - txn.due_date).days
            txn.fine = days_late * 5
            
        txn.save()
        
        # Restore copy
        book = txn.book
        book.available_copies += 1
        book.save()
        
        return api_success(data=BookTransactionSerializer(txn).data, message="Book returned successfully.")


class TransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = BookTransaction.objects.all()
        return api_success(data=BookTransactionSerializer(qs, many=True).data)


class MyBooksListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = BookTransaction.objects.filter(student=request.user, status='issued')
        return api_success(data=BookTransactionSerializer(qs, many=True).data)
