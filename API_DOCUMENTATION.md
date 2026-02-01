# CassieahBoT Command Development Documentation

Welcome to the official documentation for authoring commands in CassieahBoT. This guide covers everything from basic command structure to advanced interaction systems.

---

## 1. Command Anatomy
Every command is a TypeScript/JavaScript module that exports three primary components: `meta`, `style` (optional), and `entry`.

### Basic Template
```ts
import { CommandMeta, CommandStyle, CommandContext } from "../types/main";

// 1. Metadata: Defines how the bot recognizes and treats your command
export const meta: CommandMeta = {
  name: "hello",
  description: "A friendly greeting command",
  category: "General",
  version: "1.0.0",
  otherNames: ["hi", "hey"],
  waitingTime: 5, // 5-second cooldown per user
  role: 0,        // 0=Everyone, 1=Admin, 2=Bot Admin
};

// 2. Style (Optional): Automatically formats your output
export const style: CommandStyle = {
  title: "👋 Greetings",
  contentFont: "fancy", // Uses Unicode stylish fonts
  lineDeco: "altar",    // Adds decorative lines
};

// 3. Entry: The logic that runs when the command is called
export async function entry({ input, output }: CommandContext) {
  await output.reply("Hello there! How can I help you today?");
}
```

---

## 2. The Context Object (`ctx`)
The `entry` function receives a `CommandContext` object. Always **destructure** it for cleaner code.

### Common Context Variables
| Variable | Type | Description |
| :--- | :--- | :--- |
| `input` | `InputClass` | Methods and properties to read the user's message. |
| `output` | `OutputClass` | Methods to send messages, reactions, or edits. |
| `money` | `UserStatsManager` | Database handle for user data and economy. |
| `reply`, `send` | `Function` | Convenience aliases for `output.reply` and `output.send`. |
| `args` | `string[]` | Array of words provided after the command. |
| `prefix` | `string` | The current bot prefix (e.g., `!`). |
| `commandName`| `string` | The name or alias used to call the command. |

---

## 3. Messaging APIs
There are two ways to send messages: using the `output` object (recommended for advanced features) or using convenience helpers directly from the context.

### Basic Messaging
```ts
// 1. Using convenience helpers (shorthand)
await reply("Hello! This is a shorthand reply.");
await send("Hello! This is a shorthand message.", "thread_id");

// 2. Using the output object (full control)
await output.reply("Hello! I am auto-styled.");
await output.send("Announcement!", "thread_id");

// 3. Attachments (URL or Stream)
await attachment("https://example.com/image.png", "Look at this!");
// OR
await output.attach("Look at this!", "https://example.com/image.png");
```

### Reactions & Edits
```ts
// 1. Reactions
await reaction("❤️"); // React to user message (shorthand)
await output.reaction("❤️"); // Same as above

// 2. Edits (Self-editing is easiest)
const msg = await reply("Processing...");
await msg.editSelf("Done!"); // Recommended

// Alternatively, manual edit:
await output.edit("Done!", msg.messageID);

// 3. Unsending
await msg.unsendSelf(); // Recommended
await output.unsend(msg.messageID); // Manual
```

### Interactive Systems (Advanced)
```ts
// 1. Confirmation Dialog
await output.confirm("Do you want to delete your progress?", async ({ yes, output: confirmOutput }) => {
  if (yes) {
    await confirmOutput.reply("Progress deleted.");
  } else {
    await confirmOutput.reply("Action cancelled.");
  }
});

// 2. Wait for a Reply (Conversation Flow)
const ask = await output.reply("What is your favorite color?");
ask.atReply(async ({ input, output }) => {
  await output.reply(`Oh, ${input.body} is a great color!`);
});

// 3. Wait for a Reaction
const poll = await output.reply("React with 👍 if you agree.");
poll.atReaction(async ({ input, output }) => {
  if (input.reaction === "👍") {
    await output.reply("Thank you for your feedback!");
  }
});
```

---

## 4. The `input` Object (Reading Data)
The `input` object contains everything about the incoming message.

### Properties
```ts
input.body;       // Full message text
input.args;       // Arguments array (same as ctx.args)
input.senderID;   // User's ID
input.threadID;   // Group or Private chat ID
input.role;       // User's role (0, 1, 1.5, 2)
input.isGroup;    // Boolean: Is this a group chat?
input.messageReply; // Object if the user replied to a message
```

### Useful Methods
```ts
input.test(/regex/i);       // Regex test on body
input.equal("hello");       // Exact match test
input.hasRole(1);           // Check if user has role (e.g., Admin)
input.lower();              // Returns a copy of input with lowercase body
input.isThreadAdmin(uid);   // Async check if user is GC admin
```

---

## 5. Economy & Database (`money`)
The `money` handle (alias for `usersDB`) allows you to persist user data.

### Quick Money Helpers
```ts
// Get balance
const balance = await getMoney(input.senderID);

// Set balance
await setMoney(balance + 500, input.senderID);
```

### Complex Data (Caching System)
```ts
// Fetch user data from cache/DB
const user = await money.getCache(input.senderID);
console.log(user.name);
console.log(user.money);

// Save updated data
await money.setItem(input.senderID, {
  money: user.money - 100,
  lastUsed: Date.now()
});
```

---

## 6. Inventory System
CassieahBoT includes a powerful `Inventory` class for item management.

### Real-World Example: Adding an Item
```ts
import { Inventory } from "@cass-modules/InventoryEnhanced";

export async function entry({ input, output, money, user }) {
  const inv = new Inventory(user.inventory ?? []);

  if (inv.isFull()) {
    return output.reply("Your inventory is full!");
  }

  inv.addOne({
    key: "magic_potion",
    name: "Magic Potion",
    icon: "🧪",
    flavorText: "Restores 50 HP",
    type: "food"
  });

  await money.setItem(input.senderID, {
    inventory: Array.from(inv) // Always use Array.from() when saving
  });

  await output.reply("You received a Magic Potion!");
}
```

---

## 7. Subcommands & Routing
For complex commands with many actions (like a shop or game), use `SpectralCMDHome`.

### Using `defineEntry`
```ts
import { defineEntry } from "@cass/define";

export const entry = defineEntry({
  async deposit({ output, args }) {
    await output.reply(`Deposited ${args[0]}`);
  },
  async withdraw({ output, args }) {
    await output.reply(`Withdrew ${args[0]}`);
  }
});
```

### Advanced Routing with `SpectralCMDHome`
```ts
import { SpectralCMDHome } from "@cassidy/spectral-home";

const configs = [
  {
    key: "buy",
    description: "Buy an item",
    handler: async ({ output, args }) => {
      await output.reply(`You bought ${args[0]}`);
    }
  },
  {
    key: "sell",
    description: "Sell an item",
    handler: async ({ output, args }) => {
      await output.reply(`You sold ${args[0]}`);
    }
  }
];

export async function entry(ctx: CommandContext) {
  const home = new SpectralCMDHome({ isHypen: false }, configs);
  return home.runInContext(ctx);
}
```

---

## 8. Global Utility Extensions
The framework extends standard JavaScript types with useful helpers.

### String Helpers
```ts
// 1. Placeholder Formatting
const text = "Hello %1, you have %2 coins.".formatWith("Liane", 500);

// 2. Font Stylers
const fancy = "Stylish Text".toFonted("fancy"); // 𝒮𝓉𝓎𝓁𝒾𝓈𝒽 𝒯𝑒𝓍𝓉
const bold = "Bold Text".toFonted("bold");     // 𝐁𝐨𝐥𝐝 𝐓𝐞𝐱𝐭
```

### Array & Function Helpers
```ts
// Random element from array
const randomItem = ["Apple", "Banana", "Cherry"].randomValue();

// Delay execution (async)
await utils.delay(2000); // Wait 2 seconds
```

### Prototype Extensions
CassieahBoT extends built-in prototypes for faster development.

```ts
// Array
[1, 2, 3].randomValue(); // Returns a random element
[1, 1, 2].toUnique();    // Returns [1, 2]

// Object
const obj = { a: 1, b: 2 };
obj.cloneByJSON();   // Deep clone
obj.randomValue();   // Returns 1 or 2
obj.randomKey();     // Returns "a" or "b"

// String
"hello %1".formatWith("world"); // "hello world"
"Fancy".toFonted("fancy");      // "𝓕𝓪𝓷𝓬𝔂"
"title case".toTitleCase();     // "Title Case"
```

---

**Industry Grade Documentation** | CassieahBoT 4.0+
