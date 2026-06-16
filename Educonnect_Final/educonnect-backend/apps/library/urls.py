from django.urls import re_path
from . import views

urlpatterns = [
    re_path(r'^library/books/?$', views.BookListView.as_view(), name='book-list'),
    re_path(r'^library/books/(?P<pk>\d+)/?$', views.BookDetailView.as_view(), name='book-detail'),
    re_path(r'^library/issue/?$', views.BookIssueView.as_view(), name='book-issue'),
    re_path(r'^library/return/(?P<transaction_id>\d+)/?$', views.BookReturnView.as_view(), name='book-return'),
    re_path(r'^library/transactions/?$', views.TransactionListView.as_view(), name='book-transactions'),
    re_path(r'^library/my-books/?$', views.MyBooksListView.as_view(), name='book-mybooks'),
]
