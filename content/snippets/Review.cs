// illustrative c# model for this page: not CHC Review Studio source.
// the desk on the right follows these types; a finding always carries the exact text that caused it.
using System;
using System.Collections.Generic;
using System.Linq;

public enum Severity { Low, Medium, High }
public enum Status { Open, Resolved }

/// <summary>an exact span of the source text: the proof a finding points at.</summary>
public readonly record struct Anchor(int Start, int Length)
{
    public string Quote(string source) => source.Substring(Start, Length);
}

public sealed record Finding(int Id, Anchor Evidence, string Comment, Severity Severity, Status Status)
{
    public Finding Resolve() => this with { Status = Status.Resolved };
}

public sealed class Review
{
    private readonly List<Finding> _findings = new();
    private int _nextId = 1;

    public Review(string source) => Source = source;

    public string Source { get; }
    public IReadOnlyList<Finding> Findings => _findings;

    public Finding Add(Anchor evidence, string comment, Severity severity)
    {
        if (evidence.Start < 0 || evidence.Length <= 0 || evidence.Start + evidence.Length > Source.Length)
            throw new ArgumentOutOfRangeException(nameof(evidence), "evidence must sit inside the source");

        var finding = new Finding(_nextId++, evidence, comment, severity, Status.Open);
        _findings.Add(finding);
        return finding;
    }

    public void Resolve(int id)
    {
        var at = _findings.FindIndex(f => f.Id == id);
        if (at >= 0) _findings[at] = _findings[at].Resolve();
    }

    public int OpenCount(Severity atLeast) =>
        _findings.Count(f => f.Status == Status.Open && f.Severity >= atLeast);
}
