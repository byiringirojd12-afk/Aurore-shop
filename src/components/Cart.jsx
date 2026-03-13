export default function Cart({ cartItems }) {
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
      {cartItems.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <div className="space-y-3">
          {cartItems.map(item => (
            <div key={item.id} className="flex justify-between">
              <span>{item.name}</span>
              <span>${item.price}</span>
            </div>
          ))}
          <div className="mt-4 font-bold text-lg">Total: ${total}</div>
        </div>
      )}
    </div>
  );
}