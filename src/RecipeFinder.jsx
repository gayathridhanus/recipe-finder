import React, { useState } from "react";
import "./RecipeFinder.css";

const RecipeFinder = () => {
  const [ingredients, setIngredients] = useState("");
  const [exclude, setExclude] = useState("");
  const [mood, setMood] = useState("");
  const [time, setTime] = useState("");
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMeal, setSelectedMeal] = useState(null);

  const moodMapping = {
    "Comfort Food": "cheese",
    Spicy: "chili",
    "Quick Meal": "egg",
    Healthy: "salad",
  };

  const mergeMeals = (arrays) => {
    const all = arrays.flat();
    const unique = [];
    const seen = new Set();
    for (const m of all) {
      if (!seen.has(m.idMeal)) {
        seen.add(m.idMeal);
        unique.push(m);
      }
    }
    return unique;
  };

  const fetchRecipes = async () => {
    const inputList = ingredients
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");

    const baseIngredients =
      inputList.length > 0 ? inputList : [moodMapping[mood] || "chicken"];

    if (baseIngredients.length === 0) {
      setError("Please enter at least one ingredient or choose a mood!");
      return;
    }

    setLoading(true);
    setError("");
    setMeals([]);
    setSelectedMeal(null);

    try {
      const mealPromises = baseIngredients.map(async (ing) => {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(
            ing
          )}`
        );
        const data = await res.json();
        return data.meals || [];
      });

      const allMealsLists = await Promise.all(mealPromises);
      let allMeals = mergeMeals(allMealsLists);

      const detailedPromises = allMeals.map(async (meal) => {
        const res = await fetch(
          `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`
        );
        const data = await res.json();
        return data.meals ? data.meals[0] : null;
      });

      const detailedMeals = (await Promise.all(detailedPromises)).filter(Boolean);

      let finalMeals = detailedMeals;
      if (exclude) {
        const excludeLower = exclude.toLowerCase();
        finalMeals = detailedMeals.filter((meal) => {
          for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`];
            if (ing && ing.toLowerCase().includes(excludeLower)) return false;
          }
          return true;
        });
      }

      if (time === "Under 15 minutes") finalMeals = finalMeals.slice(0, 3);
      if (time === "30–45 minutes") finalMeals = finalMeals.slice(0, 5);

      setMeals(finalMeals);
      if (finalMeals.length === 0) setError("No recipes found for your filters.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const closePopup = () => setSelectedMeal(null);

  return (
    <div className="container">
      {/* 🥣 Header Section */}
      <div className="header">
        <img src="/images/left-bowl.png" alt="Left Dish" className="corner-img left" />

        <div className="header-content">
          <h1>Welcome to Recipe Finder</h1>
          <p id="paragraph">
            Explore a world of delicious meals! Get recipes based on ingredients,
            mood, and cooking time.
          </p>
        </div>

        <img src="/images/right-bowl.png" alt="Right Dish" className="corner-img right" />
      </div>

      {/* 🍳 Input Section */}
      <div className="input-container">
        <input
          type="text"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
          placeholder="Ingredients you have (comma separated)"
          className="input"
        />

        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="select"
        >
          <option value="">Select Mood</option>
          <option value="Comfort Food">Comfort Food</option>
          <option value="Spicy">Spicy</option>
          <option value="Quick Meal">Quick Meal</option>
          <option value="Healthy">Healthy</option>
        </select>

        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="select"
        >
          <option value="">Cooking Time</option>
          <option value="Under 15 minutes">Under 15 minutes</option>
          <option value="30–45 minutes">30–45 minutes</option>
          <option value="1 hour or more">1 hour or more</option>
        </select>

        <input
          type="text"
          value={exclude}
          onChange={(e) => setExclude(e.target.value)}
          placeholder="Ingredients to avoid (e.g., seafood)"
          className="input"
        />

        <button onClick={fetchRecipes} className="button" disabled={loading}>
          {loading ? "Searching..." : "Get Recipes"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {/* 🧁 Meals Grid */}
      <div className="grid">
        {meals.map((meal) => (
          <div
            key={meal.idMeal}
            className="card"
            onClick={() => setSelectedMeal(meal)}
          >
            <img src={meal.strMealThumb} alt={meal.strMeal} className="image" />
            <h3>{meal.strMeal}</h3>
          </div>
        ))}
      </div>

      {/* 🔍 Popup Section */}
      {selectedMeal && (
        <div className="overlay" onClick={closePopup}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <button onClick={closePopup} className="close-btn">
              ✖
            </button>
            <h2>{selectedMeal.strMeal}</h2>
            <img
              src={selectedMeal.strMealThumb}
              alt={selectedMeal.strMeal}
              className="popup-img"
            />
            <p>
              <strong>Category:</strong> {selectedMeal.strCategory} |{" "}
              <strong>Area:</strong> {selectedMeal.strArea}
            </p>
            <h4>🧂 Ingredients:</h4>
            <ul className="ingredients">
              {Array.from({ length: 20 }, (_, i) => i + 1)
                .map((n) => {
                  const ing = selectedMeal[`strIngredient${n}`];
                  const measure = selectedMeal[`strMeasure${n}`];
                  return ing ? (
                    <li key={n}>
                      {ing} {measure && `- ${measure}`}
                    </li>
                  ) : null;
                })
                .filter(Boolean)}
            </ul>
            <h4>📖 Instructions:</h4>
            <p className="instructions">{selectedMeal.strInstructions}</p>
            {selectedMeal.strYoutube && (
              <p>
                🎥 Watch tutorial:{" "}
                <a
                  href={selectedMeal.strYoutube}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube Link
                </a>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeFinder;
