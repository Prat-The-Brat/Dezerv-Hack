from django.urls import path
from .views import (
    buy_stock, sell_stock, get_user_stocks, get_user_transactions,
    get_last_trade, create_group, join_group, get_grp_leaderboard,
    init_db, get_groups, get_historical_data, get_latest_data, create_user, get_user, get_last_5_trades
)

urlpatterns = [
    # Game-related endpoints
    path('buy/', buy_stock, name='buy_stock'),
    path('sell/', sell_stock, name='sell_stock'),
    path('portfolio/', get_user_stocks, name='portfolio'),
    path('create_group/', create_group, name='create_group'),
    path('join_group/', join_group, name='join_group'),
    path('get_user_transactions/<str:user_id>/<int:group_id>/', get_user_transactions, name="get_user_transactions"),
    path('get_last_trade/<int:group_id>/', get_last_trade, name="get_last_trade"),
    path('leaderboard/<str:group_name>/', get_grp_leaderboard, name='get_grp_leaderboard'),
    path('last_5_trades/<str:group_name>/', get_last_5_trades, name='get_last_5_trades'),
    path('init_db/', init_db, name='init_db'),
    path('get_groups/<str:user_id>/', get_groups, name='get_groups'),
    
    # Stock data endpoints
    path('historical/<str:symbol>/', get_historical_data, name='get_historical_data'),
    path('latest/<str:symbol>/', get_latest_data, name='get_latest_data'),
    path('create_user/', create_user, name='create_user'),
    path('get_user/<str:user_id>/', get_user, name='get_user'),
]



