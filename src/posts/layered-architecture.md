---
layout: layouts/post.njk
permalink: /blog/layered-architecture/index.html
title: Layered Architecture
date: '2024-03-02'
tags: ['Architecture']
draft: false
description: Explore the layers of .NET Clean Architecture, a refined evolution of traditional Layered Architecture. Emphasizing the Dependency Rule, this approach organizes entities, use cases, adapters, and frameworks, ensuring a one-directional flow. While offering benefits like maintainability and testability, caution is advised to prevent undue complexity. 
---

# Navigating the Layers: A Dive into .NET Clean Architecture

In this exploration, we delve into the layers of software architecture, with a particular focus on .NET Clean Architecture. Let's embark on a journey through the intricacies of this architectural approach.

## The Landscape of Architectural Approaches

Key architectural approaches:

* **Layered Architecture**
* Screaming Architecture 
* **Hexagonal Architecture (Ports and Adapters)**
* **Onion Architecture**
* Microservices Architecture
* SOA (Service-Oriented Architecture)
* Event-Driven Architecture
* DCI (Data, Context and Interaction)
* BCE (Boundary Control Entity)

In the vast realm of software architecture, various approaches compete for attention. From the classic **Layered Architecture** to the trendy **Microservices Architecture**, each method boasts its strengths and weaknesses. Among these, we encounter the **Clean Architecture**, a term that may evoke notions of purity and perfection. However, my experience has taught me to approach this nomenclature with caution.

## Clean Architecture: An Evolution of Layers

Clean Architecture, often misunderstood as a departure from the traditional **Layered Architecture**, is more of an evolution than a revolution. It is a refined version of Layered Architecture, a nuanced take on organizing the layers within a software system.

Lets take a look at the evolution using each architecture's diagram and observe how all have the same objective: the separation of concerns

Separation of concerns is achieved in different ways in each architecture.
In layered architectures, each layer depends on the inner layer and the last layer knows all other layers.

Layered Architecture: 
![Layered Architecture](/images/layered-architecture.png)

In the other architectures, the layers are displayed in concentric circles but not all layers know about each other.

Onion Architecture:
![Onion Architecture](/images/onion-architecture.png)

Clean Architecture:
![Clean Architecture](/images/clean-architecture.png)

## Understanding the Layers

At the core of Clean Architecture lies its layers – an outer circle encompassing the inner layers. Traditionally, we might have the **Data Access Layer**, **Business Layer**, and **Presentation Layer**. Clean Architecture transforms these into a circle, splitting the groups into subgroups like **User Interface**, **Infrastructure**, and **Tests**. The direction of dependencies is crucial; they always point inward, ensuring a cleaner, more organized structure.

## The Dependency Rule: Guiding Light of Clean Architecture

At the heart of Clean Architecture lies the **Dependency Rule**, a beacon guiding developers through the intricate layers. Dependencies must always point inward; the source code should not be entangled in outward or inter-layer dependencies. This rule safeguards the integrity of the architecture, promoting maintainability, robustness, and adaptability to future changes.

**Crossing Boundaries with Dependency Inversion**

Communications that contradict The Dependency Rule must be resolved by using the dependency injection principle.
Only simple data structures crosses the boundaries such as Data Transfer Objects, Arguments in function calls, HashMaps, etc...
We don’t want to cheat and pass entities, database rows or any data structures, that violates The Dependency Rule.

## Unveiling the Layers: A Closer Look

Let's take a closer look at the layers within Clean Architecture:

1. **Entities Layer:** At the core, it contains data entities and essential business rules. Promotes reusability, maintainability, and testability.

2. **Use Case Layer:** Orchestrates business workflows, accommodating different use cases for various clients. Houses non-core business elements specific to the application.

    Encapsulates and implements the application-specific business rules, translates user inputs or actions into operations on the domain entities.
    Orchestrates the flow of data between the entities and the outside world, controls how data is retrieved or stored and how entities are persisted and can coordinate several entities to perform a complete operation.

    changes in this layer should not affect entities neither external layers such database and UI,although changes to the operation of the application can change user cases, which will affect this layer

3. **Interface Adapters:** Acts as a set of adapters that convert data from the format most convenient for an external agent, like a database or the UI i.e. this layer will contain the whole MVC architecture of a GUI. Models in this layer are likely just data structures that are passed form controller to use cases and then back to presenters. Responsible for conversion of data from external sources, such an external service.

    All database specific code should be in this layer and no code inward from this layer should know anything about the database.

4. **Frameworks and Drivers:** The outermost layer, composed of frameworks and tools such as ORM, web framework, etc..., gluing services together without much custom code.

## Adding More Layers? Proceed with Caution!

While Clean Architecture typically revolves around four layers, there's room for flexibility. However, the ** Dependency Rule** always applies. The layers should maintain a one-directional flow from the outer rings to the inner circle.

## Caution: Complexity Ahead!

Clean Architecture, while powerful, comes with a caveat – it can introduce complexity if not implemented thoughtfully. Poorly executed Clean Architecture can resemble an onion with each layer inducing tears.

## When to Choose Clean Architecture

The decision to embrace Clean Architecture hinges on several factors. If your team values **Domain-Driven Design**, wishes to focus on the domain model, and desires highly testable code, Clean Architecture might be the right fit. However, my experience advises against adopting it blindly, especially for larger teams or projects with diverse developers.

## Resources for the Journey

For those eager to delve deeper, consider exploring these resources:

- [Clean Code Blog Post](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html): The original Clean Code blog post provides a foundational understanding of Clean Architecture.
- [.NET Core Clean Architecture Playlist](https://www.youtube.com/watch?v=fhM0V2N1GpY&list=PLzYkqgWkHPKBcDIP5gzLfASkQyTdy0t4k&ab_channel=AmichaiMantinband): A comprehensive video series offering practical insights into .NET Core and ASP.NET Clean Architecture.
- [Clean Architecture Template](https://github.com/ardalis/CleanArchitecture): A well-known Clean Architecture template repository for .NET Core, providing a structured starting point for projects.
- [Clean Architecture with Specification Pattern Talk](https://www.youtube.com/watch?v=yF9SwL0p0Y0): A recent talk introducing a Clean Architecture template with unconventional patterns like the specification pattern.

## Book Recommendation

As a parting gift, consider exploring a Microsoft book on .NET Core and web applications [here](https://dotnet.microsoft.com/en-us/download/e-book/aspnet/pdf). The book offers a hands-on approach, detailing the architecture of a system and delving into various architectural patterns.

In conclusion, Clean Architecture stands as a powerful tool in the arsenal of software architects. However, wield it wisely, consider the specifics of your team and project, and always keep the **Dependency Rule** in mind.
