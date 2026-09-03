# Card brand marks

`CardBrandIcon` loads `/brands/<brand>.svg` by the brand string Stripe returns
(`visa`, `mastercard`, `amex`, …), falling back to `card.svg`.

**These are placeholders, not the licensed artwork.** Visa and Mastercard both
publish official assets with usage rules. To use the real marks, replace the
file of the same name — keep the `48 x 16` viewBox so layout is unchanged. No
code needs to change.

- Visa: https://merchant.visa.com (Visa Brand Center)
- Mastercard: https://brand.mastercard.com
- American Express: https://merchant-brand.americanexpress.com
