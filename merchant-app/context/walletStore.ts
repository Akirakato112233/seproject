// Shared store to avoid require cycle: ShopContext <-> OrdersContext
let _shopId: string | null = null;

export function setWalletShopId(id: string) {
  _shopId = id;
}

export function getWalletShopId(): string | null {
  return _shopId;
}
