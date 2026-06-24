---
title: Open Closed Principle
date: '2024-01-27'
tags: ['SOLID']
description: This article delves into the Open Closed Principle (OCP) in SOLID software development. It underscores the significance of allowing classes to be open for extension while closed for modification, promoting code that is easily extendable, reduces bugs, and minimizes impact on dependent code. The OCP, when applied alongside other SOLID principles, enables developers to create adaptable, maintainable, and bug-resistant code.
---

# Open Closed Principle

## Open Closed Principle in Action

The Open Closed Principle (OCP) stands as a beacon in the world of software development, advocating that software artifacts should be open to extension but closed for modification. This principle fosters the creation of systems that can easily adapt and evolve without undergoing significant upheaval. OCP seamlessly integrates with other SOLID principles, including the Single Responsibility Principle and Dependency Inversion Principle.

### Benefits of the Open Closed Principle

Implementing OCP offers a host of advantages:

- **Reduced Bug Introduction:** By keeping components separate, the likelihood of introducing bugs decreases.
- **Minimized Impact on Dependent Code:** Changes are less likely to break dependent code, ensuring a stable system.
- **Fewer Conditions:** Avoiding massive switch statements simplifies decision-making in the code.

However, it is imperative to strike a delicate balance between writing concrete and abstract code. Excessive abstraction can introduce complexity, making the code harder to understand.

### Applying the Open Closed Principle

Practical approaches to implementing OCP include:

- **Parameterized Methods:** Use parameters to make a method perform various tasks without modifying its core structure.
- **Inheritance:** Leverage the ability to override functions in subclasses without modifying the base class.
- **Composition and Injection:** Embrace the preferred approach in .NET by utilizing services, classes, commands, and injection to achieve desired outcomes.

Check out this repository for some great exercises for OCP: https://github.com/rolandpop/SOLID-katas

### Development Strategies

A pragmatic approach to development is crucial. Begin by writing concrete code, and as patterns start to emerge, consider refactoring to apply the Open Closed Principle. Striking a balance between extensibility and abstraction is key, recognizing that excessive abstraction can introduce unnecessary complexity.

### Legacy System Considerations

When introducing new features to a legacy system, implement them using new classes. This approach allows developers to apply SOLID principles from the outset, ensuring changes are incremental, maintainable, and easily unit-testable.

### Useful Patterns

Several design patterns support the Open Closed Principle:

- **Factory Pattern**
- **Strategy Pattern**
- **Decorator Pattern**
- **Adapter Pattern**

While many patterns exist, these are frequently used, with the Factory Pattern standing out as particularly beneficial.

## Example

Let's consider a scenario where we have a class that prints messages based on different types. Initially, we might have a single method handling all cases. Later, we can refactor the code using the Open Closed Principle.

Before Refactoring:

```csharp
using System;

public class MessagePrinter
{
    public void PrintMessage(string messageType)
    {
        if (messageType.Equals("info", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine("This is an informational message.");
        }
        else if (messageType.Equals("warning", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine("Warning: Something needs attention.");
        }
        else if (messageType.Equals("error", StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine("Error: Something went wrong.");
        }
        // More conditions for other message types...
    }
}

class Program
{
    static void Main()
    {
        MessagePrinter printer = new MessagePrinter();
        
        // Example Usage
        printer.PrintMessage("info");
        printer.PrintMessage("warning");
        printer.PrintMessage("error");
        // More usages...
    }
}
```

After Refactoring:

```csharp
using System;

// Interface for message printing
public interface IMessagePrinter
{
    void PrintMessage();
}

// Concrete classes for each message type
public class InfoMessagePrinter : IMessagePrinter
{
    public void PrintMessage()
    {
        Console.WriteLine("This is an informational message.");
    }
}

public class WarningMessagePrinter : IMessagePrinter
{
    public void PrintMessage()
    {
        Console.WriteLine("Warning: Something needs attention.");
    }
}

public class ErrorMessagePrinter : IMessagePrinter
{
    public void PrintMessage()
    {
        Console.WriteLine("Error: Something went wrong.");
    }
}

// Client code remains unchanged
class Program
{
    static void Main()
    {
        // Usage with OCP
        PrintMessage(new InfoMessagePrinter());
        PrintMessage(new WarningMessagePrinter());
        PrintMessage(new ErrorMessagePrinter());
    }

    // Method to print messages, adhering to OCP
    static void PrintMessage(IMessagePrinter printer)
    {
        printer.PrintMessage();
    }
}
```
In this refactored code, we've created separate classes for each message type, implementing the IMessagePrinter interface. This adheres to the Open Closed Principle by allowing the system to be open for extension (adding new message types) without modifying existing code. The client code remains unchanged and can easily accommodate new message types without modifying the MessagePrinter class.

## Conclusion

The Open Closed Principle transcends being a mere guideline; it is a mindset that encourages developers to embrace the constant evolution of software. By steadfastly following SOLID principles, particularly OCP, developers can craft code that is not only adaptable and maintainable but also resistant to bugs. As we conclude our exploration of the Open Closed Principle, the journey to writing code that aligns with both computers and human understanding is ongoing, marked by a commitment to continuous improvement and learning.
