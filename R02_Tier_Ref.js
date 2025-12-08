function assignTier(amount) {
  // Handle empty or non-numeric values
  if (!amount || isNaN(amount)) {
    return "No Data";
  }
  
  amount = Number(amount);
  
  if (amount > 500000000) {
    return "Tier 1 ($500M+)";
  } else if (amount > 200000000 && amount <= 500000000) {
    return "Tier 2 ($200M–$500M)";
  } else if (amount > 50000000 && amount <= 200000000) {
    return "Tier 3 ($50M–$200M)";
  } else if (amount > 10000000 && amount <= 50000000) {
    return "Tier 4 ($10M–$50M)";
  } else {
    return "Below Tier 4 (<$10M)";
  }
}