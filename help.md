# Jessie Lesbian Cryptocurrency Exchange

## Our unique features no other exchanges offer

### Islamic trading accounts
We charge no trading fees on all accounts and trades, reguardless of size.

### Uniswap.NET Automated Market Maker
One of the reason leading to the failure of MintME.com is low liquidity. Our Uniswap.NET Automated Market Maker fixes this by providing extra liquidity to markets. Uniswap.NET is also a halal way to turn cryptocurrencies into more cryptocurrencies on our exchange.

### MintME-Polygon bridge
Bridge your MintME over to Polygon and use the latest DeFi products, such as Uniswap V3, Balancer, and 1inch. You can bridge MintME back from Polygon as well.

## FAQs

### What software did you use?
[OpenCEX.NET: Advanced-technology open-source cryptocurrency exchange in C#](https://www.github.com/EUBIToken/OpenCEX.NET)

### Is this exchange safe
While OpenCEX.NET is still experimental, the Jessie Lesbian Cryptocurrency Exchange is safe. We used the best cybersecurity practices in our exchange. We battle-tested our code in our isolated test servers, before uploading it in our production servers. If you want to, you can learn our cybersecurity best practices [here](https://www.coursera.org/learn/identifying-security-vulnerabilities).

### Why do I have the option to choose blockchain when withdrawing and depositing MintME?
Because we have a bridge that lets you migrate MintME to the Polygon blockchain and back. When you withdraw MintME to Polygon, MintME is debited from your trading account, and WMintME is minted on Polygon, and when you deposit MintME from Polygon, WMintME is burned on Polygon, and MintME is credited to your trading account.

[The token contract on the Polygon blockchain](https://polygonscan.com/token/0x2b7bede8a97021da880e6c84e8b915492d2ae216).

#### NOTE: WMintME is a flash-mintable asset-backed token.

### About deposits and withdrawals

#### Why do I need to click on "finalize deposit"?
OpenCEX.NET doesn't scan deposit addresses for balances like MintME.com and Highpay-Pool. Instead, clicking on "finalize deposit" reminds OpenCEX.NET to check your deposit address for cryptocurrencies, and credit them to your account if they are found.

#### I got an "insufficent balance" error while depositing
Make sure that you deposit MintME/MATIC first, and then deposit your ERC-20 tokens. The OpenCEX.NET ERC20 deposit mechanism uses a lot of blockchain gas, especially when used for the first time. We believe that funding the deposit address first with MintME/MATIC for gas is a bit risky, and used a deterministic address smart contract instead.

#### I got an "insufficent balance" error while withdrawing
Reduce your withdrawal and try again. Also, please note that the withdrawal amount you entered is BEFORE transaction fees are added, not AFTER transaction fees are added.

#### When will my deposit get credited to my account?
Deposits need at least 10 blockchain confirmations before they are credited to your account. This means 2 minutes and 10 seconds for MintME, and 20 seconds for Polygon.

#### My deposit is not getting credited to my account!
1. Look up your deposit address on the blockchain explorer
2. If nothing have been sent from the deposit address, wait a few minutes and click on "finalize deposit" again.
3. If it doesn't work, you can contact Jessie Lesbian at jessielesbian@eubitoken.com. She have database administrator privileges and can manually update your balance.


### What if I forgot my password?
If you forgot your password during the test launches, your funds are lost forever.

### What are your listing requirements?
1. Listing fee: 50 MATIC (not required for extremely serious and partner projects such as Bitcoin and PolyEUBI).
2. Verified contract source code (not required for tokens deployed using MintME.com).
3. Legitimate and serious project (no scamcoins, memecoins, or shitcoins).

Extremely serious cryptocurrencies, such as Ethereum, may be listed without contacting the team, free of charge.

### Why no trading fees?
Because we have advertisements, and trading fees are bad for liquidity.

### Can you explain the 3 order types?
1. Limit order: An order to buy or sell at a specific price or better. This is the only order type that comes with a minimum order size, and the only order type that is ever admitted to the order book on the Jessie Lesbian Cryptocurrency Exchange.
2. Immediate or cancel: An order to buy or sell that must be executed immediately. Any portion of an immediate or cancel order that cannot be filled immediately will be cancelled. Immediate or cancel orders are useful for arbitrage trades, and they have no minimum order size.
3. Fill or kill: An order to buy or sell that must be executed immediately in its entirety; otherwise, the entire order will be cancelled. The're is no minimum order size for fill or kill orders.

### How do you switch trading pairs?
You need to scroll down and click this arrow button
![image](https://user-images.githubusercontent.com/55774978/155685469-a8c8cadc-07a9-425f-8ac2-582f795679c8.png)

## Made possible by
jessielesbian: Most backend work, and some frontend work

WestnileOD: Most frontend work

EUBI: Hosting fees, and marketing in the future

## Known bugs (will fix later)
1. Renember me not working
2. Balances page freeze after deposit/withdraw

