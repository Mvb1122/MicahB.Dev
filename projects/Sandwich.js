/*
TITLE: A random sandwich generator.
AUTHOR: Micah B
*/


// Returns a promise which resolves after ms miliseconds.
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Collate information on the sandwiches.
    // First, outline the different kinds of speciality sandwiches that are offered.
let SelectWich = ["Buffalo Chicken", "Grilled Chicken", "Sweet Onion Chicken Teriyaki", "BLT", "Chicken Bacon Ranch", "Cold Cut Combo", "Italian BMT", "Veggie Delight"];

    // Use JS Objects to represent the special meats, while also listing the sandwiches which they're allowed to be on. (The Subway app limits your selection.)
    // Here, when an item doesn't have a limit, it's implied that they're only allowed to be on the speciality sandwiches which they're named after.
let Meat = [
    { Name: "Black Forest Ham" },
    {
        Name: "Grilled Chicken",
        Limits: ["Buffalo Chicken", "Grilled Chicken", "Sweet Onion", "Chicken Teriyaki"]
    },
    {
        Name: "Bacon",
        Limits: ["BLT"]
    },
    {
        Name: "Chicken Bacon",
        Limits: ["Chicken Bacon Ranch"]
    },
    {
        Name: "Ham Salami Bologna",
        Limits: ["Cold Cut Combo"]
    },
    {
        Name: "Pepperoni Genoa Salami Black Forest Ham",
        Limits: ["Italian BMT"]
    },
    { Name: "Meatballs" },
    { Name: "Oven Roasted Turkey" },
    { Name: "Oven Roasted Turkey and Ham" },
    { Name: "Pepperoni" },
    { Name: "Roast Beef" },
    { Name: "Rotisserie Style Chicken" },
    { Name: "Pepperoni Salami" },
    { Name: "Steak" },
    { Name: "Tuna" },
    {
        Name: "No Meat",
        Limits: ["Veggie Delight"]
    }
]

// As I mentioned before, when a meat doesn't have a limit listed, it's because they're only allowed to be on the speciality sandwich that's named after the specified meat,
    // So I add the un-limited meats as options for speciality sandwiches and also set the limits programmatically here.
Meat.forEach(meat => {
    if (meat.Limits == null) {
        SelectWich.push(meat.Name);
        meat.Limits = [meat.Name];
    }
});

// List the other available ingredients.
let Bread = ["Hearty Multigrain", "Artisan Italian", "Artisan Flatbread", "Italian Herbs and Cheese"];
let Cheese = ["American Cheese", "Pepper Jack", "Provolone", "Monterey"];
let Vegetables = ["Lettuce", "Spinach", "Tomatoes", "Cucumbers", "Green Peppers", "Red onions", "Pickles", "Black Olives", "Jalapenos", "Banana Peppers"];
let Sauces = ["Oil", "Red Wine Vinegar", "Reg Mayo", "Yellow Mustard", "Honey Mustard", "Buffalo Sauce", "Sweet Onion Teriyaki", "Peppercorn Ranch", "Baja Chipotle", "MVP Parmesan Vinaigrette", "Roasted Garlic Aioli"];

// You can add other stuff if you pay extra, so I also list those here. 
let WildMagic = ["Bacon", "Sliced Avocado", "Pepperoni", "BelGioioso Fresh Moz", "Smash Avocado", "Capicola"];

// Randomly chooses an item from the selected array and returns it.
let RandomFromArray = (array) => 
    array[Math.floor(Math.random() * array.length)];

// States whether an array contains another value.
function ArrayContains(array, value) {
    for (let i = 0; i < array.length; i++)
        if (array[i] == value) return true;

    return false;
}

// Converts an array to a more human-friendly format, using commas and "and".
function ArrayToString(array) {
    let output = "";
    if (array.length > 1) {
        for (let i = 0; i < array.length - 1; i++)
            output += array[i] + (i == array.length - 2 ? "" : ", ");
        output += " and " + array[array.length - 1];
    } else if (array.length == 1)
        output = array[0];
    
    return output;
}

function StringStartsWithVowel(string) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    for (let i = 0; i < vowels.length; i++)
        if (string[0].toLowerCase() == vowels[i]) return true;
    return false;
}

let sleepTime = 3000;
async function Generate() {
    // Display loading screen...
    console.log("Showing Loading Screen!");
    document.getElementById("LoadingScreen").style.display = "block";
    document.getElementById("GenerateScreen").style.display = "none";
    let loadingTimer = sleep(sleepTime);

    // Set up stuff pertaining to the generation.
        // Obtain relevant information from the page itself.
    let UseWildMagic = document.getElementById("WildMagicBox").checked;
    let HasMeat = document.getElementById("MeatBox").checked;

        // Create an object to represent the sandwich itself.
    let sandwich = { Base: "", Meat: "", Bread: "", Cheese: "", Vegetables: [], Sauces: [], Lettuce: false, 
        // This method generates an appropriate string for the sandwich's meat and lettuce-- like "Pepperoni", "Lettuce", or "Pepperoni with lettuce", depending on whether the sandwich has those.
        MeatAndLettuceString() {
            let MeatAndLettuce = [];
            if (UseWildMagic && HasMeat) MeatAndLettuce.push(this.Meat);
            if (this.Lettuce) MeatAndLettuce.push("lettuce");
            let output = ArrayToString(MeatAndLettuce);
            return output != "" ? ` with ${output}` : "";
        },
        
        // Describes the sandwich in human terms, as a sentence.
        toString() {
            let string = `${StringStartsWithVowel(this.Base) ? "An" : "A"} ${this.Base}${this.MeatAndLettuceString()}, on ${this.Bread}, with ${this.Cheese}${this.Sauces.length > 0 ? `, topped with ${ArrayToString(this.Sauces)}`: ""}`;
            if (Vegetables.length > 0) {
                string += ` plus ${ArrayToString(this.Vegetables)}.`;
            }

            return string
        }
    }

    // Actually randomly generate the sandwich.
        // First, select a base class.
    sandwich.Base = HasMeat ? RandomFromArray(SelectWich) : "Veggie Delight";
        // Select an appropriate meat, if it's enabled.
    if (HasMeat)
        do {
            let possibleMeat = RandomFromArray(Meat);

            // Select this meat if it's applicable (If the name of the base sandwich is in the limits of the meat and Wild magic is disabled.)
            if (ArrayContains(possibleMeat.Limits, sandwich.Base) || UseWildMagic) {
                sandwich.Meat = possibleMeat.Name;
            }
        } while (sandwich.Meat == "");

        // If the user selected Wild Magic on the selection screen, add that, too.
    if (UseWildMagic)
        sandwich.Sauces.push(RandomFromArray(WildMagic));

        // Select random other stuff.
    sandwich.Bread = RandomFromArray(Bread);
    sandwich.Cheese = RandomFromArray(Cheese);
    
    for (let i = 0; i < document.getElementById("VegetableBox").value; i++)
        sandwich.Vegetables.push(RandomFromArray(Vegetables));
    
    for (let i = 0; i < document.getElementById("SauceBox").value; i++)
        sandwich.Sauces.push(RandomFromArray(Sauces));
    
    sandwich.Lettuce = Math.floor(Math.random() * 2); 

    // Wait for the remaining 4.99 seconds, because the loading screen is fake.
    await loadingTimer;
        // Also, make it only load for 1/2 second after the first time.
    sleepTime = 500;

    // Log the sandwich, display it on screen.
    console.log(sandwich);
    console.log("Hiding Loading Screen!");
    document.getElementById("LoadingScreen").style.display = "none";
    document.getElementById("SandwichScreen").style.display = "block";
    document.getElementById("SandwichDisplay").innerHTML = "Your Sandwich:<br>" + sandwich.toString();
}

function ReturnToGenerateScreen() {
    document.getElementById("SandwichScreen").style.display = "none";
    document.getElementById("GenerateScreen").style.display = "block";
}