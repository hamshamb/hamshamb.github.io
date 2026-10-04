// an illustrative model written for this page, not CHC Review Studio source.
using System;
using System.Collections.Generic;
using System.Linq;

public enum Severity { Note, Minor, Major }
public enum Status { Open, Resolved }

/// <summary>an exact span of the source text, so every finding can point at its proof.</summary>
public readonly record struct Anchor(int Start, int Length)
{
    public string Quote(string source) => source.Substring(Start, Length);
}

public sealed record Finding(Guid Id, Anchor Evidence, string Comment, Severity Severity, Status Status)
{
    public Finding Resolve() => this with { Status = Status.Resolved };
}

public sealed class Review
{
    private readonly List<Finding> _findings = new();

    public Review(string source) => Source = source;

    public string Source { get; }
    public IReadOnlyList<Finding> Findings => _findings;

    public Finding Add(Anchor evidence, string comment, Severity severity)
    {
        if (evidence.Start < 0 || evidence.Start + evidence.Length > Source.Length)
            throw new ArgumentOutOfRangeException(nameof(evidence), "evidence must sit inside the source");

        var finding = new Finding(Guid.NewGuid(), evidence, comment, severity, Status.Open);
        _findings.Add(finding);
        return finding;
    }

    public int OpenCount(Severity atLeast) =>
        _findings.Count(f => f.Status == Status.Open && f.Severity >= atLeast);
}
