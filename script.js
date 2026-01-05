function calculate() {
  const userAge = document.getElementById("userAge").value;
  const spouseAge = document.getElementById("spouseAge").value;
  const retirementState = document.getElementById("state").value;

  document.getElementById("ageConservative").textContent =
    calculateRetirementAge(
      userAge,
      spouseAge,
      retirementState,
      "conservative"
    );

  document.getElementById("ageNormal").textContent =
    calculateRetirementAge(
      userAge,
      spouseAge,
      retirementState,
      "normal"
    );

  document.getElementById("ageOptimistic").textContent =
    calculateRetirementAge(
      userAge,
      spouseAge,
      retirementState,
      "optimistic"
    );
}

// Placeholder function – logic to be implemented later
function calculateRetirementAge(
  userAge,
  spouseAge,
  retirementState,
  scenario
) {
  // Temporary random retirement age between 55 and 75
  return Math.floor(Math.random() * 21) + 55;
}
