from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from decimal import Decimal
from .models import UserGroup, Transaction, Group, StockData, AppUser
from django.contrib.auth.models import User
import requests
import os
from .utils import initialise_db
from collections import defaultdict
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json


@api_view(['POST'])
def buy_stock(request):
    try:
        user_id = request.data.get("user_id")
        group_id = request.data.get("group_id")
        ticker = request.data.get("ticker")
        quantity = request.data.get("quantity")
        timestamp = request.data.get("timestamp")  # Unix timestamp

        if not user_id or not group_id or not ticker or not quantity or not timestamp:
            return Response(
                {"error": "Missing required parameters"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
            timestamp = int(timestamp)
            if quantity <= 0:
                return Response(
                    {"error": "Quantity must be a positive integer"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"error": "Invalid quantity or timestamp format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = get_object_or_404(AppUser, user_id=user_id)
        group = get_object_or_404(Group, id=group_id)
        user_group = get_object_or_404(UserGroup, user=user, group=group)

        # Get the closest stock price for the given timestamp
        stock_entry = (
            StockData.objects.filter(ticker=ticker, datetime__lte=timestamp)
            .order_by("-datetime")
            .first()
        )

        if not stock_entry:
            return Response(
                {"error": "No stock price found for the given timestamp"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        latest_price = Decimal(str(stock_entry.close_price))
        total_price = latest_price * Decimal(str(quantity))

        # Convert current_balance to Decimal for comparison
        current_balance = Decimal(str(user_group.current_balance))

        if current_balance < total_price:
            return Response(
                {"error": f"Insufficient balance. You have ₹{current_balance} but need ₹{total_price}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user_group.current_balance = current_balance - total_price
        user_group.save()

        Transaction.objects.create(
            user=user,
            group=group,
            action="buy",
            ticker=ticker,
            quantity=quantity,
            price=latest_price,
            total_price=total_price,
        )

        return Response({
            "message": "Stock purchased successfully",
            "price_per_stock": str(latest_price),
            "total_price": str(total_price),
            "remaining_balance": str(user_group.current_balance),
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def sell_stock(request):
    try:
        user_id = request.data.get("user_id")
        group_id = request.data.get("group_id")
        ticker = request.data.get("ticker")
        timestamp = request.data.get("timestamp")
        quantity = request.data.get("quantity")

        if not user_id or not group_id or not ticker or not timestamp or not quantity:
            return Response(
                {"error": "Missing required parameters"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = int(quantity)
            timestamp = int(timestamp)
            if quantity <= 0:
                return Response(
                    {"error": "Quantity must be a positive integer"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {"error": "Invalid quantity or timestamp format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = get_object_or_404(AppUser, user_id=user_id)
        group = get_object_or_404(Group, id=group_id)
        user_group = get_object_or_404(UserGroup, user=user, group=group)

        # Check if user has enough stocks to sell
        transactions = Transaction.objects.filter(user=user, group=group, ticker=ticker)
        current_holdings = 0
        
        for transaction in transactions:
            if transaction.action == "buy":
                current_holdings += transaction.quantity
            elif transaction.action == "sell":
                current_holdings -= transaction.quantity
        
        if current_holdings < quantity:
            return Response(
                {"error": f"Insufficient stocks. You have {current_holdings} stocks of {ticker}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        stock_entry = (
            StockData.objects.filter(ticker=ticker, datetime__lte=timestamp)
            .order_by("-datetime")
            .first()
        )

        if not stock_entry:
            return Response(
                {"error": "No stock price found for the given timestamp"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        latest_price = Decimal(str(stock_entry.close_price))
        total_price = latest_price * Decimal(str(quantity))

        user_group.current_balance = Decimal(str(user_group.current_balance)) + total_price
        user_group.save()

        Transaction.objects.create(
            user=user,
            group=group,
            action="sell",
            ticker=ticker,
            quantity=quantity,
            price=latest_price,
            total_price=total_price,
        )

        return Response({
            "message": "Stock sold successfully",
            "price_per_stock": str(latest_price),
            "total_price": str(total_price),
            "updated_balance": str(user_group.current_balance),
            "remaining_stocks": current_holdings - quantity
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'POST'])
def get_user_stocks(request):
    try:
        if request.method == 'GET':
            # For GET requests, get user_id from query parameters
            user_id = request.GET.get("user_id")
            group_id = request.GET.get("group_id")
        else:
            # For POST requests, get user_id from request body
            user_id = request.data.get("user_id")
            group_id = request.data.get("group_id")

        if not user_id or not group_id:
            return Response(
                {"error": "Missing required parameters"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = AppUser.objects.get(user_id=user_id)
        group = Group.objects.get(id=group_id)
        user_group = UserGroup.objects.get(user=user, group=group)    
        
        transactions = Transaction.objects.filter(user=user, group=group)
        stock_holdings = defaultdict(lambda: {'ticker': '', 'quantity': 0, 'total_invested': Decimal(0)})
        
        for transaction in transactions:
            ticker = transaction.ticker
            if transaction.action == "buy":
                stock_holdings[ticker]['ticker'] = ticker
                stock_holdings[ticker]['quantity'] += transaction.quantity
                stock_holdings[ticker]['total_invested'] += transaction.total_price
            elif transaction.action == "sell":
                stock_holdings[ticker]['quantity'] -= transaction.quantity
                stock_holdings[ticker]['total_invested'] -= transaction.total_price
                
                if stock_holdings[ticker]['quantity'] <= 0:
                    del stock_holdings[ticker]
        
        return Response(list(stock_holdings.values()), status=status.HTTP_200_OK)
    
    except AppUser.DoesNotExist:
        return Response(
            {"error": "User not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Group.DoesNotExist:
        return Response(
            {"error": "Group not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except UserGroup.DoesNotExist:
        return Response(
            {"error": "User is not a member of this group"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def create_group(request):
    group_name = request.data.get('group_name')
    user_id=request.data.get('user_id')
    
    user=AppUser.objects.get(user_id=user_id)

    if not group_name:
        return Response(
            {"error": "Group name is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if Group.objects.filter(group_name=group_name).exists():
        return Response(
            {"error": "Group name already exists"}, 
            status=status.HTTP_409_CONFLICT
        )
    
    try:
        group = Group.objects.create(group_name=group_name)
        UserGroup.objects.create(user=user, group=group)
        return Response(
            {
                "message": "Group created successfully",
                "group_id": group.id,
                "group_name": group.group_name
            },
            status=status.HTTP_201_CREATED
        )
        
    except Exception as e:
        return Response(
            {"error": "Failed to create group", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def join_group(request):
    user_id = request.data.get('user_id')
    group_name = request.data.get('group_name')
    
    if not user_id or not group_name:
        return Response(
            {"error": "Missing required parameters"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = AppUser.objects.get(user_id=user_id)
        group = Group.objects.get(group_name=group_name)
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Group.DoesNotExist:
        return Response(
            {"error": "Group not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if UserGroup.objects.filter(user=user, group=group).exists():
        return Response(
            {"error": "User already in group"}, 
            status=status.HTTP_409_CONFLICT
        )
    
    UserGroup.objects.create(user=user, group=group)
    return Response(
        {"message": "User joined group successfully"}, 
        status=status.HTTP_201_CREATED
    )

@api_view(['GET'])
def get_grp_leaderboard(request, group_name):
    try:
        group = Group.objects.get(group_name=group_name)
    except Group.DoesNotExist:
        return Response(
            {"error": "Group not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )

    leaderboard = UserGroup.objects.filter(group=group).order_by('-current_balance')
    result = []

    for ug in leaderboard:
        user_assets = {}

        # Get all transactions for this user in the group
        transactions = Transaction.objects.filter(user=ug.user, group=group)
        
        # Calculate total quantity owned per stock
        for tx in transactions:
            if tx.action == "buy":
                user_assets[tx.ticker] = user_assets.get(tx.ticker, 0) + tx.quantity
            elif tx.action == "sell":
                user_assets[tx.ticker] = user_assets.get(tx.ticker, 0) - tx.quantity

        # Remove stocks with 0 or negative quantity
        user_assets = {ticker: qty for ticker, qty in user_assets.items() if qty > 0}

        # Calculate total asset value
        asset_value = Decimal(0)
        for ticker, quantity in user_assets.items():
            latest_stock = StockData.objects.filter(ticker=ticker).order_by('-datetime').first()
            if latest_stock:
                asset_value += Decimal(quantity) * Decimal(latest_stock.close_price)

        user_data = {
            "user": ug.user.name,
            "portfolio_value": float(ug.current_balance),
            "asset_value": float(asset_value),
            "total_value": float(ug.current_balance + asset_value)  # Total balance including assets
        }

        # Get last trade information
        last_trade = transactions.order_by('-timestamp').first()
        if last_trade:
            user_data["last_trade"] = {
                "action": last_trade.action,
                "ticker": last_trade.ticker,
                "quantity": last_trade.quantity,
                "price": float(last_trade.price),
                "timestamp": last_trade.timestamp
            }

        result.append(user_data)

    return Response(result, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_last_5_trades(request, group_name):
    try:
        group = get_object_or_404(Group, group_name=group_name)
        
        # Fetch the last 5 transactions for the group
        transactions = (
            Transaction.objects.filter(group=group)
            .order_by("-timestamp")[:5]
        )

        result = []
        for transaction in transactions:
            result.append({
                "user": transaction.user.name,
                "action": transaction.action,
                "ticker": transaction.ticker,
                "quantity": transaction.quantity,
                "price": float(transaction.price),
                "total_price": float(transaction.total_price),
                "timestamp": transaction.timestamp,
            })

        return Response(result, status=status.HTTP_200_OK)

    except Group.DoesNotExist:
        return Response(
            {"error": "Group not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def init_db(request):
    try:
        bool = initialise_db()
        if bool:
            return Response(
                {"message": "Database initialized successfully"}, 
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Failed to initialize database"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    

@api_view(['GET'])
def get_last_trade(request, group_id):
    try:
        transactions = Transaction.objects.filter(group_id=group_id).order_by('-timestamp')
        
        if transactions.exists():
            last_trade = transactions.first()
            result = {
                "user": last_trade.user.username,
                "action": last_trade.action,
                "ticker": last_trade.ticker,
                "quantity": last_trade.quantity,
                "price": float(last_trade.price),
                "timestamp": last_trade.timestamp
            }
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(
                {"message": "No trades found for this group"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_user_transactions(request, user_id, group_id):
    try:
        user = get_object_or_404(AppUser, user_id=user_id)
        transactions = Transaction.objects.filter(user=user, group_id=group_id).order_by('-timestamp')
        
        if not transactions.exists():
            return Response(
                {"message": "No transactions found for this user in this group"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        result = [
            {
                "action": txn.action,
                "ticker": txn.ticker,
                "quantity": txn.quantity,
                "price": float(txn.price),
                "total_price": float(txn.total_price),
                "timestamp": txn.timestamp
            }
            for txn in transactions
        ]
        
        return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
def get_groups(request, user_id):
        try:
            user = AppUser.objects.get(user_id=user_id)
            user_groups = UserGroup.objects.filter(user=user)
            
            # Serialize the groups data
            groups_data = [{
                'group_id': ug.group.id,
                'group_name': ug.group.group_name,
                'current_balance': float(ug.current_balance)
            } for ug in user_groups]
            
            return Response(groups_data, status=status.HTTP_200_OK)
        except AppUser.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
@api_view(['GET'])
def get_historical_data(request, symbol):
    try:
        # Get historical data for the symbol
        historical_data = StockData.objects.filter(ticker=symbol).order_by('datetime')
        
        # Convert to list of dictionaries
        data = list(historical_data.values(
            'datetime', 'open_price', 'high_price', 
            'low_price', 'close_price', 'volume'
        ))
        
        return Response(data)
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_latest_data(request, symbol):
    try:
        # Get the latest data point for the symbol
        latest_data = StockData.objects.filter(ticker=symbol).order_by('-datetime').first()
        
        if not latest_data:
            return Response(
                {"error": f"No data found for symbol {symbol}"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        data = {
            'datetime': latest_data.datetime,
            'open_price': latest_data.open_price,
            'high_price': latest_data.high_price,
            'low_price': latest_data.low_price,
            'close_price': latest_data.close_price,
            'volume': latest_data.volume
        }
        
        return Response(data)
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@require_http_methods(["POST"])
def create_user(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        name = data.get('name')

        if not user_id or not name:
            return JsonResponse({
                'success': False,
                'error': 'Missing required fields'
            }, status=400)

        # Get or create user
        user, created = AppUser.objects.get_or_create(
            user_id=user_id,
            defaults={'name': name}
        )

        if not created:
            # Update name if user exists but name changed
            user.name = name
            user.save()

        return JsonResponse({
            'success': True,
            'user_id': user.user_id,
            'name': user.name
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_user(request, user_id):
    try:
        user = AppUser.objects.get(user_id=user_id)
        
        # Calculate total current investment from transactions
        transactions = Transaction.objects.filter(user=user)
        total_investment = Decimal('0')
        
        for transaction in transactions:
            if transaction.action == "buy":
                total_investment += transaction.total_price
            elif transaction.action == "sell":
                total_investment -= transaction.total_price
        
        return JsonResponse({
            'success': True,
            'name': user.name,
            'current_investment': float(total_investment)
        })
    except AppUser.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'User not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
        