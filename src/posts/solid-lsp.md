---
title: Liskov Substitution Principle
date: '2024-01-28'
tags: ['SOLID']
description: This blog post delves into the Liskov Substitution Principle (LSP) within SOLID software development. Highlighting the importance of seamless substitution of subtypes for their base types.
---

# Liskov Substitution Principle

Liskov Substitution Principle, coined by Barbara Liskov in the '80s, is encapsulated in a simple yet profound concept: "Subtypes must be substitutable for their base types." This principle guides us in using inheritance in object-oriented languages effectively. It encourages the creation of code that aligns with the Open Closed Principle.

## The Rectangle-Square Conundrum

To illustrate LSP, let's consider a classic example involving rectangles and squares. While in geometry, a square "is a" rectangle, applying this relationship directly in programming through inheritance can lead to violations of LSP.

The inherent problem arises when attempting to maintain the invariants of both shapes simultaneously. A square, by definition, must have equal sides, while a rectangle allows independent side lengths. Attempting to force a square to inherit from a rectangle can compromise the integrity of both shapes.

## Detecting LSP Violations

How can you identify if LSP is being violated in your code?

1. **Type Checking:** If you find yourself using `is` or `as` keywords to check the type of a variable within polymorphic code, it might signal an LSP violation.
2. **Null Checking:** Excessive null checks often indicate a deviation from LSP.
3. **Not Implemented Exceptions:** If you come across numerous "not implemented" exceptions, it's a red flag for LSP violations.

## Solutions to LSP Violations

To rectify LSP violations, consider these approaches:

- **Helper Classes:** Instead of relying solely on inheritance, use helper classes to encapsulate specific logic.
- **Interfaces Over Inheritance:** In C#, where multiple inheritance is limited, prefer interfaces over inheritance to prevent unnecessary coupling.

## Example

Let's consider a scenario involving the classic example of a Square and a Rectangle. Initially, we may have a design that violates the Liskov Substitution Principle (LSP). We'll then refactor the code to adhere to LSP.

Before refactoring:

```csharp
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }

    public int CalculateArea()
    {
        return Width * Height;
    }
}

public class Square : Rectangle
{
    public override int Width
    {
        set { base.Width = base.Height = value; }
    }

    public override int Height
    {
        set { base.Width = base.Height = value; }
    }
}

class Program
{
    static void Main()
    {
        Rectangle rectangle = new Square();
        rectangle.Width = 5;
        rectangle.Height = 4;

        // Expected: 20, Actual: 25
        Console.WriteLine($"Area: {rectangle.CalculateArea()}"); 
    }
}
```

In this example, we've created a Square class that inherits from Rectangle. However, we override the setters for Width and Height to always set both properties to the same value. This violates the LSP because a square is not substitutable for a rectangle in terms of behavior.

After refactoring:

```csharp
public class Shape
{
    public virtual int CalculateArea()
    {
        // Default implementation
        return 0;
    }
}

public class Rectangle : Shape
{
    public int Width { get; set; }
    public int Height { get; set; }

    public override int CalculateArea()
    {
        return Width * Height;
    }
}

public class Square : Shape
{
    public int SideLength { get; set; }

    public override int CalculateArea()
    {
        return SideLength * SideLength;
    }
}

class Program
{
    static void Main()
    {
        Rectangle rectangle = new Rectangle { Width = 5, Height = 4 };
        Square square = new Square { SideLength = 5 };

        // Expected: 20
        Console.WriteLine($"Rectangle Area: {rectangle.CalculateArea()}");
        // Expected: 25
        Console.WriteLine($"Square Area: {square.CalculateArea()}");
    }
}
```
In the refactored code, we've introduced a common base class Shape that has a virtual method CalculateArea. Both Rectangle and Square now inherit from Shape and provide their own implementations of CalculateArea. This adheres to LSP, as a Square is now a true substitute for a Shape, and each shape calculates its area according to its specific behavior.

## Wrapping Up

In conclusion, Liskov Substitution Principle plays a crucial role in maintaining the integrity of object-oriented code. Ensuring that subtypes are true substitutes for their base types helps prevent bugs that might be challenging to trace.

As you navigate through your software design journey, keep in mind the importance of LSP. It's not just about adhering to principles; it's about creating software that is reliable, scalable, and adaptable.

Happy coding!
