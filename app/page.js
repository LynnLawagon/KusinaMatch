"use client";

import { useState, useMemo, useEffect } from "react";
import recipesData from "@/data/recipes.json";

const COMMON_STAPLES = [
  { name: "rice", category: "Grains & Base" },
  { name: "pasta", category: "Grains & Base" },
  { name: "eggs", category: "Proteins" },
  { name: "chicken", category: "Proteins" },
  { name: "tofu", category: "Proteins" },
  { name: "canned sardines", category: "Proteins" },
  { name: "mung beans", category: "Proteins" },
  { name: "garlic", category: "Aromatics & Veg" },
  { name: "onion", category: "Aromatics & Veg" },
  { name: "tomato", category: "Aromatics & Veg" },
  { name: "eggplant", category: "Aromatics & Veg" },
  { name: "spinach", category: "Aromatics & Veg" },
  { name: "soy sauce", category: "Condiments & Fats" },
  { name: "vinegar", category: "Condiments & Fats" },
  { name: "cooking oil", category: "Condiments & Fats" },
  { name: "butter", category: "Condiments & Fats" },
  { name: "calamansi", category: "Condiments & Fats" },
];

export default function PantryToPlateApp() {
  const [pantry, setPantry] = useState([
    "rice",
    "eggs",
    "garlic",
    "soy sauce",
    "cooking oil",
  ]);
  const [customIngredient, setCustomIngredient] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // all | ready | almost
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [checkedShoppingList, setCheckedShoppingList] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved pantry from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kusamatch_pantry");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setPantry(parsed);
      }
    } catch (e) {
      console.error("Failed to load pantry from storage", e);
    }
    setIsLoaded(true);
  }, []);

  // Persist pantry changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem("kusamatch_pantry", JSON.stringify(pantry));
    } catch (e) {
      console.error("Failed to save pantry", e);
    }
  }, [pantry, isLoaded]);

  const toggleIngredient = (item) => {
    const normalized = item.trim().toLowerCase();
    setPantry((prev) =>
      prev.includes(normalized)
        ? prev.filter((i) => i !== normalized)
        : [...prev, normalized]
    );
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    const normalized = customIngredient.trim().toLowerCase();
    if (!normalized) return;
    if (!pantry.includes(normalized)) {
      setPantry((prev) => [...prev, normalized]);
    }
    setCustomIngredient("");
  };

  const categories = useMemo(() => {
    const cats = new Set(recipesData.map((r) => r.category));
    return ["All", ...Array.from(cats)];
  }, []);

  const matchedRecipes = useMemo(() => {
    return recipesData
      .map((recipe) => {
        const have = recipe.ingredients.filter((ing) =>
          pantry.includes(ing.toLowerCase())
        );
        const missing = recipe.ingredients.filter(
          (ing) => !pantry.includes(ing.toLowerCase())
        );
        const matchPercent = Math.round(
          (have.length / recipe.ingredients.length) * 100
        );

        return {
          ...recipe,
          haveItems: have,
          missingItems: missing,
          missingCount: missing.length,
          matchPercent,
          status:
            missing.length === 0
              ? "ready"
              : missing.length <= 2
              ? "almost"
              : "missing",
        };
      })
      .filter((recipe) => {
        if (filterMode === "ready" && recipe.status !== "ready") return false;
        if (
          filterMode === "almost" &&
          recipe.status !== "ready" &&
          recipe.status !== "almost"
        )
          return false;
        if (
          selectedCategory !== "All" &&
          recipe.category !== selectedCategory
        )
          return false;
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          const inTitle = recipe.title.toLowerCase().includes(q);
          const inIng = recipe.ingredients.some((i) =>
            i.toLowerCase().includes(q)
          );
          if (!inTitle && !inIng) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.missingCount !== b.missingCount) {
          return a.missingCount - b.missingCount;
        }
        return b.matchPercent - a.matchPercent;
      });
  }, [pantry, filterMode, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    let ready = 0;
    let almost = 0;
    recipesData.forEach((r) => {
      const missingCount = r.ingredients.filter(
        (ing) => !pantry.includes(ing.toLowerCase())
      ).length;
      if (missingCount === 0) ready++;
      else if (missingCount <= 2) almost++;
    });
    return { ready, almost, total: recipesData.length };
  }, [pantry]);

  const groupedStaples = useMemo(() => {
    const groups = {};
    COMMON_STAPLES.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item.name);
    });
    // Add any user-added custom ingredients not in COMMON_STAPLES
    const knownNames = new Set(COMMON_STAPLES.map((s) => s.name));
    const customItems = pantry.filter((p) => !knownNames.has(p));
    if (customItems.length > 0) {
      groups["Custom Added"] = customItems;
    }
    return groups;
  }, [pantry]);

  const toggleStep = (recipeId, idx) => {
    const key = `${recipeId}-${idx}`;
    setCompletedSteps((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleShoppingItem = (item) => {
    setCheckedShoppingList((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              K
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-none">
                KusinaMatch
              </h1>
              <p className="text-xs text-stone-500 dark:text-zinc-400 mt-0.5">
                Smart Pantry-to-Plate Recommender
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {stats.ready} Ready Now
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium">
              {stats.almost} Missing ≤ 2 items
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Pantry Inventory */}
          <aside className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-base">Your Pantry Stock</h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400">
                  {pantry.length} ingredients selected
                </p>
              </div>
              {pantry.length > 0 && (
                <button
                  onClick={() => setPantry([])}
                  className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-medium cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button
                onClick={() =>
                  setPantry([
                    "rice",
                    "eggs",
                    "garlic",
                    "soy sauce",
                    "cooking oil",
                  ])
                }
                className="text-xs px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 transition cursor-pointer"
              >
                Basic Student Dorm
              </button>
              <button
                onClick={() =>
                  setPantry([
                    "rice",
                    "chicken",
                    "garlic",
                    "onion",
                    "tomato",
                    "soy sauce",
                    "vinegar",
                    "cooking oil",
                    "eggs",
                  ])
                }
                className="text-xs px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 transition cursor-pointer"
              >
                Full Weekend Fridge
              </button>
            </div>

            {/* Add Custom Ingredient Input */}
            <form onSubmit={handleAddCustom} className="flex gap-2 mb-5">
              <input
                type="text"
                value={customIngredient}
                onChange={(e) => setCustomIngredient(e.target.value)}
                placeholder="Add item (e.g., cheese, chili)..."
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-stone-300 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition cursor-pointer"
              >
                Add
              </button>
            </form>

            {/* Categorized Ingredient Chips */}
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {Object.entries(groupedStaples).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-zinc-500 mb-2">
                    {category}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((item) => {
                      const active = pantry.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleIngredient(item)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                            active
                              ? "bg-amber-600 border-amber-600 text-white shadow-xs"
                              : "bg-stone-50 dark:bg-zinc-950 border-stone-200 dark:border-zinc-800 text-stone-700 dark:text-zinc-300 hover:border-amber-400"
                          }`}
                        >
                          {active ? "✓ " : "+ "}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Right Area: Filter Controls & Recipe Cards */}
          <section className="lg:col-span-8 space-y-6">
            {/* Search & Match Filters */}
            <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by dish name or ingredient..."
                  className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-stone-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="inline-flex rounded-xl bg-stone-100 dark:bg-zinc-800 p-1">
                  {[
                    { id: "all", label: "All Recipes" },
                    { id: "ready", label: `Ready (${stats.ready})` },
                    { id: "almost", label: "Missing ≤ 2" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterMode(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        filterMode === tab.id
                          ? "bg-white dark:bg-zinc-950 text-stone-900 dark:text-white shadow-xs"
                          : "text-stone-600 dark:text-zinc-400 hover:text-stone-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipe Results Grid */}
            {matchedRecipes.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
                <p className="text-base font-medium text-stone-700 dark:text-zinc-300">
                  No recipes match your current filter.
                </p>
                <p className="text-sm text-stone-500 dark:text-zinc-400 mt-1">
                  Try switching the filter to &ldquo;All Recipes&rdquo; or adding a few more pantry items on the left.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {matchedRecipes.map((recipe) => (
                  <article
                    key={recipe.id}
                    className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Status Badge & Match Bar */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            recipe.status === "ready"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : recipe.status === "almost"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {recipe.status === "ready"
                            ? "✓ Ready to Cook"
                            : `Missing ${recipe.missingCount} item${
                                recipe.missingCount > 1 ? "s" : ""
                              }`}
                        </span>
                        <span className="text-xs font-medium text-stone-500 dark:text-zinc-400">
                          {recipe.prepTime} • {recipe.calories}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-stone-900 dark:text-white leading-snug">
                        {recipe.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1.5 line-clamp-2">
                        {recipe.description}
                      </p>

                      {/* Ingredient Breakdown Tags */}
                      <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {recipe.haveItems.map((ing) => (
                            <span
                              key={ing}
                              className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                            >
                              ✓ {ing}
                            </span>
                          ))}
                          {recipe.missingItems.map((ing) => (
                            <span
                              key={ing}
                              className="text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                            >
                              Missing: {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-xs text-stone-400">
                        {recipe.matchPercent}% pantry match
                      </span>
                      <button
                        onClick={() => setActiveRecipe(recipe)}
                        className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-amber-600 dark:bg-zinc-100 dark:hover:bg-amber-500 text-white dark:text-zinc-900 dark:hover:text-white text-xs font-semibold transition cursor-pointer"
                      >
                        Open Kitchen Mode →
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Distraction-Free Kitchen Mode Modal */}
      {activeRecipe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-stone-200 dark:border-zinc-800 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Kitchen Mode • {activeRecipe.category}
                </span>
                <h2 className="text-2xl font-bold mt-1">
                  {activeRecipe.title}
                </h2>
                <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1">
                  Prep & Cook: {activeRecipe.prepTime} • Servings:{" "}
                  {activeRecipe.servings} • {activeRecipe.calories}
                </p>
              </div>
              <button
                onClick={() => setActiveRecipe(null)}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-medium cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {/* Missing Items & Smart Substitutions */}
            {activeRecipe.missingItems.length > 0 && (
              <div className="mt-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                  Missing Ingredients (Tap to add to quick shopping checklist)
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {activeRecipe.missingItems.map((item) => {
                    const checked = !!checkedShoppingList[item];
                    return (
                      <button
                        key={item}
                        onClick={() => toggleShoppingItem(item)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                          checked
                            ? "line-through bg-stone-200 text-stone-500 border-stone-300 dark:bg-zinc-800 dark:border-zinc-700"
                            : "bg-white text-rose-700 border-rose-200 dark:bg-zinc-900 dark:text-rose-300 dark:border-rose-800"
                        }`}
                      >
                        {checked ? "✓ " : "🛒 "}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chef Substitutions Matrix */}
            {activeRecipe.substitutions &&
              Object.keys(activeRecipe.substitutions).length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold mb-2">
                    Smart Pantry Substitutions
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(activeRecipe.substitutions).map(
                      ([ing, tip]) => (
                        <div
                          key={ing}
                          className="text-xs p-3 rounded-xl bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800"
                        >
                          <span className="font-semibold capitalize text-amber-700 dark:text-amber-400">
                            Out of {ing}?{" "}
                          </span>
                          <span className="text-stone-600 dark:text-zinc-300">
                            {tip}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Interactive Step-by-Step Instructions */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">
                Cooking Steps (Tap a step to mark complete)
              </h3>
              <ol className="space-y-3">
                {activeRecipe.steps.map((step, idx) => {
                  const done = !!completedSteps[`${activeRecipe.id}-${idx}`];
                  return (
                    <li
                      key={idx}
                      onClick={() => toggleStep(activeRecipe.id, idx)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex gap-3.5 items-start ${
                        done
                          ? "bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 opacity-75"
                          : "bg-stone-50 border-stone-200 hover:border-amber-400 dark:bg-zinc-950 dark:border-zinc-800"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          done
                            ? "bg-emerald-600 text-white"
                            : "bg-stone-200 text-stone-700 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}
                      >
                        {done ? "✓" : idx + 1}
                      </span>
                      <p
                        className={`text-sm leading-relaxed ${
                          done
                            ? "line-through text-stone-500"
                            : "text-stone-800 dark:text-zinc-200"
                        }`}
                      >
                        {step}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
