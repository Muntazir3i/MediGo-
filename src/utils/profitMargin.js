const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Profit details for a medicine sold at a given discount off MRP.
 *
 * costWithGst = purchase rate + GST
 * sellingPrice = MRP - discount
 * profit       = sellingPrice - costWithGst
 * margin %     = profit / sellingPrice * 100
 * markup %     = profit / costWithGst * 100
 */
export const calculateDiscountScenario = ({
  rate = 0,
  gstPercentage = 0,
  mrp = 0,
  discountPercent = 0,
} = {}) => {
  const purchaseRate = Math.max(0, Number(rate) || 0);
  const gst = Math.max(0, Number(gstPercentage) || 0);
  const mrpValue = Math.max(0, Number(mrp) || 0);
  const discount = clamp(Number(discountPercent) || 0, 0, 100);

  const costWithGst = round2(purchaseRate * (1 + gst / 100));
  const discountAmount = round2(mrpValue * (discount / 100));
  const sellingPrice = round2(mrpValue - discountAmount);
  const profit = round2(sellingPrice - costWithGst);
  const marginPercent =
    sellingPrice > 0 ? round2((profit / sellingPrice) * 100) : null;
  const markupPercent =
    costWithGst > 0 ? round2((profit / costWithGst) * 100) : null;

  return {
    purchaseRate,
    gst,
    costWithGst,
    mrp: mrpValue,
    discountPercent: discount,
    discountAmount,
    sellingPrice,
    profit,
    marginPercent,
    markupPercent,
    isLoss: profit < 0,
  };
};

/**
 * Margin at full MRP. Kept for the inventory table and edit dialog.
 */
export const calculateProfitMargin = ({
  rate = 0,
  gstPercentage = 0,
  mrp = 0,
} = {}) => {
  const scenario = calculateDiscountScenario({
    rate,
    gstPercentage,
    mrp,
    discountPercent: 0,
  });

  return {
    purchaseRate: scenario.purchaseRate,
    gst: scenario.gst,
    costWithGst: scenario.costWithGst,
    mrp: scenario.mrp,
    profit: scenario.profit,
    marginPercent: scenario.marginPercent,
    markupPercent: scenario.markupPercent,
    isLoss: scenario.isLoss,
  };
};

/**
 * Discount range for a medicine.
 *
 * maxDiscountPercent is the break-even point (profit = 0).
 * recommendedDiscountPercent keeps the chosen target margin.
 */
export const calculateDiscountRange = ({
  rate = 0,
  gstPercentage = 0,
  mrp = 0,
  targetMarginPercent = 10,
} = {}) => {
  const base = calculateDiscountScenario({
    rate,
    gstPercentage,
    mrp,
    discountPercent: 0,
  });

  const targetMargin = clamp(Number(targetMarginPercent) || 0, 0, 90);
  const hasValidMrp = base.mrp > 0;
  const hasValidCost = base.costWithGst > 0;

  const rawMaxDiscount =
    hasValidMrp ? ((base.mrp - base.costWithGst) / base.mrp) * 100 : 0;
  const maxDiscountPercent = round2(clamp(rawMaxDiscount, 0, 100));

  const targetSellingPrice =
    targetMargin < 100
      ? round2(base.costWithGst / (1 - targetMargin / 100))
      : 0;

  const rawRecommendedDiscount = hasValidMrp
    ? ((base.mrp - targetSellingPrice) / base.mrp) * 100
    : 0;

  const recommendedDiscountPercent = round2(
    clamp(rawRecommendedDiscount, 0, maxDiscountPercent)
  );

  return {
    ...base,
    hasValidMrp,
    hasValidCost,
    targetMarginPercent: targetMargin,
    maxDiscountPercent,
    breakEvenSellingPrice: base.costWithGst,
    targetSellingPrice,
    recommendedDiscountPercent,
    canOfferTarget: rawRecommendedDiscount >= 0,
    isBelowTargetAtMrp:
      base.marginPercent !== null && base.marginPercent < targetMargin,
  };
};

export const formatMarginPercent = (value) => {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return '—';
  }

  const number = Number(value);
  return `${number > 0 ? '+' : ''}${number.toFixed(2)}%`;
};
