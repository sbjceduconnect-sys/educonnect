from rest_framework import serializers
from core.serializers import CamelCaseSerializer
from .models import Book, BookTransaction

class BookSerializer(CamelCaseSerializer):
    class Meta:
        model = Book
        fields = '__all__'


class BookTransactionSerializer(CamelCaseSerializer):
    book_id = serializers.IntegerField(source='book.id', read_only=True)
    user_id = serializers.IntegerField(source='student.id', read_only=True)

    class Meta:
        model = BookTransaction
        fields = '__all__'
