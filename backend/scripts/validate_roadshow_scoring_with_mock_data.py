#!/usr/bin/env python3
"""Validate roadshow scoring with the current track roster and 23 judges.

Outputs:
1) database/exports/roadshow_scoring_full_audit.json
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path


WEIGHTS = {
    "innovation": 0.2,
    "tech": 0.2,
    "application": 0.5,
    "roadshow": 0.1,
}

DEFAULT_JUDGE_COUNT = 23
TRACKS = ["academic", "productivity", "life"]
TRACK_PROJECT_ORDER = {
    "academic": [
        ["C PAPER"],
        ["MatClaw"],
        ["扣子一号"],
        ["MedRoundTable"],
        ["龙门星脉求索虾"],
        ["ResearchOS"],
        ["虾盾"],
        ["智会虾"],
        ["FrontierPilot"],
        ["Traffic Lobster"],
    ],
    "productivity": [
        ["分裂龙虾"],
        ["炎凌小龙虾"],
        ["OpenClaro"],
        ["赛博大臣"],
        ["Clawborate"],
        ["PatientClaw"],
        ["MarketBrain"],
        ["ClawFounder", "小红书运营虾"],
        ["钱迹"],
        ["IronClaw"],
    ],
    "life": [
        ["睡眠管家"],
        ["龙虾AI管家"],
        ["Rumor Checker"],
        ["Mira"],
        ["虾虾侦探"],
        ["看图成单虾"],
        ["心动甄选"],
        ["PodClaw"],
        ["Re:live", "Relive"],
        ["虾停车"],
    ],
}
TRACK_BASE_MAP = {
    "academic": {"innovation": 9.2, "tech": 9.0, "application": 8.7, "roadshow": 8.6},
    "productivity": {
        "innovation": 9.0,
        "tech": 8.8,
        "application": 9.0,
        "roadshow": 8.9,
    },
    "life": {"innovation": 8.8, "tech": 8.5, "application": 8.8, "roadshow": 8.9},
}
DEMO_JITTERS = [
    -0.5,
    -0.3,
    -0.2,
    -0.1,
    0,
    0.1,
    0.2,
    -0.25,
    0.15,
    0.3,
    -0.4,
    0.45,
    -0.15,
    0.25,
    -0.35,
    0.05,
    -0.05,
    0.18,
    -0.18,
    0.38,
    -0.28,
    0.12,
    -0.08,
]


def round_half_up(value: float, digits: int) -> float:
    quant = Decimal("1").scaleb(-digits)
    return float(Decimal(str(value)).quantize(quant, rounding=ROUND_HALF_UP))


def round1(value: float) -> float:
    return round_half_up(value, 1)


def round2(value: float) -> float:
    return round_half_up(value, 2)


def normalize_order_key(value: str) -> str:
    return "".join(
        ch
        for ch in str(value).lower()
        if ("\u4e00" <= ch <= "\u9fff") or ch.isalnum()
    )


def get_order_index_by_title(track: str, title: str) -> int:
    normalized_title = normalize_order_key(title)
    for idx, aliases in enumerate(TRACK_PROJECT_ORDER.get(track, [])):
        if any(normalize_order_key(alias) in normalized_title for alias in aliases):
            return idx
    return 10**9


def load_participants(repo_root: Path) -> list[dict]:
    data_path = repo_root / "frontend" / "src" / "data" / "participants.static.json"
    rows = json.loads(data_path.read_text(encoding="utf-8"))

    grouped: dict[str, list[dict]] = {track: [] for track in TRACKS}
    for row in rows:
        track = row.get("track") or "academic"
        if track not in grouped:
            continue
        grouped[track].append(row)

    participants: list[dict] = []
    for track in TRACKS:
        ordered = sorted(
            grouped[track],
            key=lambda row: (
                get_order_index_by_title(track, row.get("project_title", "")),
                str(row.get("id", "")),
            ),
        )
        for order, row in enumerate(ordered, start=1):
            participants.append(
                {
                    "participant_id": f"{track}-{order}",
                    "source_participant_id": str(row.get("id", "")),
                    "track_id": track,
                    "order": order,
                    "project_name": row.get("project_title", "").strip() or f"项目 {order}",
                    "team_name": row.get("organization", "").strip()
                    or row.get("full_name", "").strip()
                    or "未知团队",
                }
            )
    return participants


def make_judges(count: int = DEFAULT_JUDGE_COUNT) -> list[dict]:
    judges = []
    for idx in range(count):
        cycle = idx // len(DEMO_JITTERS)
        jitter = DEMO_JITTERS[idx % len(DEMO_JITTERS)] + cycle * 0.04
        judges.append(
            {
                "judge_index": idx,
                "judge_id": f"judge-{idx + 1}",
                "judge_name": f"评委{idx + 1}",
                "jitter": round2(jitter),
            }
        )
    return judges


def compute_judge_total(score_entry: dict) -> float | None:
    required_keys = ["innovation", "tech", "application", "roadshow"]
    if any(not isinstance(score_entry.get(key), (int, float)) for key in required_keys):
        return None

    return (
        score_entry["application"] * WEIGHTS["application"]
        + score_entry["innovation"] * WEIGHTS["innovation"]
        + score_entry["tech"] * WEIGHTS["tech"]
        + score_entry["roadshow"] * WEIGHTS["roadshow"]
    )


def build_trimmed_average_details(values: list[float]) -> dict:
    if not values:
        return {
            "count": 0,
            "sorted_values": [],
            "trimmed_values": [],
            "dropped_lowest": [],
            "dropped_highest": [],
            "average": None,
        }

    sorted_values = sorted(values)
    if len(sorted_values) <= 2:
        average = round2(sum(sorted_values) / len(sorted_values))
        return {
            "count": len(sorted_values),
            "sorted_values": [round2(v) for v in sorted_values],
            "trimmed_values": [round2(v) for v in sorted_values],
            "dropped_lowest": [],
            "dropped_highest": [],
            "average": average,
        }

    trimmed_values = sorted_values[1:-1]
    average = round2(sum(trimmed_values) / len(trimmed_values))
    return {
        "count": len(sorted_values),
        "sorted_values": [round2(v) for v in sorted_values],
        "trimmed_values": [round2(v) for v in trimmed_values],
        "dropped_lowest": [round2(sorted_values[0])],
        "dropped_highest": [round2(sorted_values[-1])],
        "average": average,
    }


def compare_results(a: dict, b: dict) -> int:
    for key in ["total", "application_avg", "innovation_avg", "tech_avg"]:
        av = a.get(key)
        bv = b.get(key)
        a_cmp = -1 if av is None else av
        b_cmp = -1 if bv is None else bv
        if a_cmp != b_cmp:
            return -1 if a_cmp > b_cmp else 1
    return 0


def needs_vote(a: dict, b: dict) -> bool:
    return (
        (a.get("total") if a.get("total") is not None else -1)
        == (b.get("total") if b.get("total") is not None else -1)
        and (
            a.get("application_avg") if a.get("application_avg") is not None else -1
        )
        == (b.get("application_avg") if b.get("application_avg") is not None else -1)
        and (
            a.get("innovation_avg") if a.get("innovation_avg") is not None else -1
        )
        == (b.get("innovation_avg") if b.get("innovation_avg") is not None else -1)
        and (a.get("tech_avg") if a.get("tech_avg") is not None else -1)
        == (b.get("tech_avg") if b.get("tech_avg") is not None else -1)
    )


def rank_results(results: list[dict]) -> list[dict]:
    sorted_results = sorted(
        results,
        key=lambda item: (
            -(item.get("total") if item.get("total") is not None else -1),
            -(item.get("application_avg") if item.get("application_avg") is not None else -1),
            -(item.get("innovation_avg") if item.get("innovation_avg") is not None else -1),
            -(item.get("tech_avg") if item.get("tech_avg") is not None else -1),
            item["participant_id"],
        ),
    )

    ranked: list[dict] = []
    current_rank = 0
    for idx, result in enumerate(sorted_results):
        previous = sorted_results[idx - 1] if idx > 0 else None
        if previous is None or compare_results(previous, result) != 0:
            current_rank = idx + 1

        enriched = dict(result)
        enriched["rank"] = current_rank
        enriched["tie"] = any(
            other["participant_id"] != enriched["participant_id"]
            and needs_vote(enriched, other)
            for other in sorted_results
        )
        ranked.append(enriched)

    return ranked


def build_mock_scores(participants: list[dict], judges: list[dict]) -> tuple[list[dict], dict]:
    row_calculations: list[dict] = []
    by_participant: dict[str, list[dict]] = {}

    for participant in participants:
        base = TRACK_BASE_MAP[participant["track_id"]]
        decay = (participant["order"] - 1) * 0.28
        rows_for_participant: list[dict] = []

        for judge in judges:
            jitter = judge["jitter"]
            innovation_raw = base["innovation"] - decay + jitter * 0.4
            tech_raw = base["tech"] - decay + jitter * 0.35
            application_raw = base["application"] - decay + jitter * 0.3
            roadshow_raw = base["roadshow"] - decay + jitter * 0.32

            innovation = round1(innovation_raw)
            tech = round1(tech_raw)
            application = round1(application_raw)
            roadshow = round1(roadshow_raw)

            innovation_term = innovation * WEIGHTS["innovation"]
            tech_term = tech * WEIGHTS["tech"]
            application_term = application * WEIGHTS["application"]
            roadshow_term = roadshow * WEIGHTS["roadshow"]
            weighted_total_raw = (
                innovation_term + tech_term + application_term + roadshow_term
            )
            weighted_total = round2(weighted_total_raw)

            calc_row = {
                "row_no": len(row_calculations) + 1,
                "participant_id": participant["participant_id"],
                "source_participant_id": participant["source_participant_id"],
                "track_id": participant["track_id"],
                "track_order": participant["order"],
                "project_name": participant["project_name"],
                "team_name": participant["team_name"],
                "judge_index": judge["judge_index"],
                "judge_id": judge["judge_id"],
                "judge_name": judge["judge_name"],
                "judge_jitter": judge["jitter"],
                "score_generation": {
                    "base_profile": {
                        "innovation": base["innovation"],
                        "tech": base["tech"],
                        "application": base["application"],
                        "roadshow": base["roadshow"],
                    },
                    "order_decay": round2(decay),
                    "pre_round": {
                        "innovation": round2(innovation_raw),
                        "tech": round2(tech_raw),
                        "application": round2(application_raw),
                        "roadshow": round2(roadshow_raw),
                    },
                    "entered_scores": {
                        "innovation": innovation,
                        "tech": tech,
                        "application": application,
                        "roadshow": roadshow,
                    },
                },
                "weighted_breakdown": {
                    "innovation_term": round2(innovation_term),
                    "tech_term": round2(tech_term),
                    "application_term": round2(application_term),
                    "roadshow_term": round2(roadshow_term),
                    "weighted_total_raw": round2(weighted_total_raw),
                    "weighted_total": weighted_total,
                },
            }
            row_calculations.append(calc_row)
            rows_for_participant.append(calc_row)

        by_participant[participant["participant_id"]] = rows_for_participant

    return row_calculations, by_participant


def build_participant_results(
    participants: list[dict], by_participant: dict[str, list[dict]]
) -> list[dict]:
    results: list[dict] = []
    for participant in participants:
        rows = by_participant[participant["participant_id"]]
        dimension_details = {}
        for key in ["innovation", "tech", "application", "roadshow"]:
            values = [
                row["score_generation"]["entered_scores"][key]
                for row in rows
                if row["score_generation"]["entered_scores"].get(key) is not None
            ]
            dimension_details[key] = build_trimmed_average_details(values)

        judge_totals = [row["weighted_breakdown"]["weighted_total"] for row in rows]
        judge_total_details = build_trimmed_average_details(judge_totals)

        results.append(
            {
                "participant_id": participant["participant_id"],
                "source_participant_id": participant["source_participant_id"],
                "track_id": participant["track_id"],
                "track_order": participant["order"],
                "project_name": participant["project_name"],
                "team_name": participant["team_name"],
                "innovation_avg": dimension_details["innovation"]["average"],
                "tech_avg": dimension_details["tech"]["average"],
                "application_avg": dimension_details["application"]["average"],
                "roadshow_avg": dimension_details["roadshow"]["average"],
                "total": judge_total_details["average"],
                "dimension_averages": dimension_details,
                "judge_totals": {
                    "values_by_judge": [
                        {
                            "judge_id": row["judge_id"],
                            "judge_name": row["judge_name"],
                            "weighted_total": row["weighted_breakdown"]["weighted_total"],
                        }
                        for row in rows
                    ],
                    "trimmed_average": judge_total_details,
                },
            }
        )
    return results


def award_for(rank: int, tie: bool) -> str:
    if tie:
        return "待投票确认"
    if rank == 1:
        return "一等奖"
    if 2 <= rank <= 4:
        return "二等奖"
    return "三等奖"


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    export_dir = repo_root / "database" / "exports"
    export_dir.mkdir(parents=True, exist_ok=True)

    participants = load_participants(repo_root)
    judges = make_judges(DEFAULT_JUDGE_COUNT)
    row_calculations, by_participant = build_mock_scores(participants, judges)
    participant_results = build_participant_results(participants, by_participant)

    track_rankings: dict[str, list[dict]] = {}
    for track in TRACKS:
        current_results = [r for r in participant_results if r["track_id"] == track]
        ranked = rank_results(current_results)
        for row in ranked:
            row["award"] = award_for(row["rank"], row["tie"])
        track_rankings[track] = ranked

    global_ranking = rank_results(participant_results)
    for row in global_ranking:
        row["award"] = award_for(row["rank"], row["tie"])

    shrimp_candidates = []
    for track in TRACKS:
        ranked = track_rankings[track]
        if ranked:
            shrimp_candidates.append(
                {
                    "track_id": track,
                    "participant_id": ranked[0]["participant_id"],
                    "project_name": ranked[0]["project_name"],
                    "team_name": ranked[0]["team_name"],
                    "score": ranked[0]["total"],
                }
            )

    audit_payload = {
        "metadata": {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "script": "backend/scripts/validate_roadshow_scoring_with_mock_data.py",
            "source_participants_file": "frontend/src/data/participants.static.json",
            "scenario": "Roadshow scoring full audit with current participants and 23 judges",
        },
        "config": {
            "judge_count": len(judges),
            "participant_count": len(participants),
            "track_counts": {
                track: sum(1 for participant in participants if participant["track_id"] == track)
                for track in TRACKS
            },
            "weights": WEIGHTS,
            "trimmed_average_rule": "Drop exactly one highest and one lowest value when count > 2, then round to 2 decimals",
            "ranking_tie_breakers": [
                "total",
                "application_avg",
                "innovation_avg",
                "tech_avg",
            ],
        },
        "judges": judges,
        "participants": participants,
        "row_calculations": row_calculations,
        "participant_results": participant_results,
        "track_rankings": track_rankings,
        "global_ranking": global_ranking,
        "shrimp_candidates": shrimp_candidates,
        "summary": {
            "total_score_rows": len(row_calculations),
            "participants_with_ties": sum(1 for row in global_ranking if row["tie"]),
            "top_3_global": [
                {
                    "rank": row["rank"],
                    "project_name": row["project_name"],
                    "team_name": row["team_name"],
                    "track_id": row["track_id"],
                    "score": row["total"],
                }
                for row in global_ranking[:3]
            ],
        },
    }

    json_path = export_dir / "roadshow_scoring_full_audit.json"
    json_path.write_text(
        json.dumps(audit_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    clean_projects = []
    ranking_map = {row["participant_id"]: row for row in global_ranking}
    for participant in participants:
        participant_id = participant["participant_id"]
        rows = by_participant[participant_id]
        ranked_row = ranking_map[participant_id]
        clean_projects.append(
            {
                "participant_id": participant_id,
                "source_participant_id": participant["source_participant_id"],
                "track_id": participant["track_id"],
                "track_order": participant["order"],
                "project_name": participant["project_name"],
                "team_name": participant["team_name"],
                "judge_scores": [
                    {
                        "judge_id": row["judge_id"],
                        "judge_name": row["judge_name"],
                        "raw_scores": row["score_generation"]["entered_scores"],
                        "weighted_score": row["weighted_breakdown"]["weighted_total"],
                    }
                    for row in rows
                ],
                "dimension_averages": {
                    "innovation": ranked_row["dimension_averages"]["innovation"],
                    "tech": ranked_row["dimension_averages"]["tech"],
                    "application": ranked_row["dimension_averages"]["application"],
                    "roadshow": ranked_row["dimension_averages"]["roadshow"],
                },
                "weighted_score_summary": ranked_row["judge_totals"]["trimmed_average"],
                "weighted_scores_by_judge": ranked_row["judge_totals"]["values_by_judge"],
                "final_scores": {
                    "innovation_avg": ranked_row["innovation_avg"],
                    "tech_avg": ranked_row["tech_avg"],
                    "application_avg": ranked_row["application_avg"],
                    "roadshow_avg": ranked_row["roadshow_avg"],
                    "total": ranked_row["total"],
                },
                "ranking": {
                    "global_rank": ranked_row["rank"],
                    "track_rank": next(
                        row["rank"]
                        for row in track_rankings[participant["track_id"]]
                        if row["participant_id"] == participant_id
                    ),
                    "tie": ranked_row["tie"],
                    "award": ranked_row["award"],
                },
            }
        )

    clean_payload = {
        "metadata": {
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "script": "backend/scripts/validate_roadshow_scoring_with_mock_data.py",
            "description": "Clean scoring audit with only objective scoring fields",
        },
        "config": {
            "judge_count": len(judges),
            "participant_count": len(participants),
            "weights": WEIGHTS,
            "final_total_rule": "Per project, compute each judge weighted score, drop exactly one highest and one lowest, average the remaining values, round to 2 decimals",
            "dimension_average_rule": "Per dimension, drop exactly one highest and one lowest among judge raw scores, average the remaining values, round to 2 decimals",
            "ranking_tie_breakers": [
                "total",
                "application_avg",
                "innovation_avg",
                "tech_avg",
            ],
        },
        "projects": clean_projects,
    }

    clean_json_path = export_dir / "roadshow_scoring_clean_audit.json"
    clean_json_path.write_text(
        json.dumps(clean_payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("Roadshow scoring validation completed")
    print(f"- Judges: {len(judges)}")
    print(f"- Participants: {len(participants)}")
    print(f"- Score rows: {len(row_calculations)}")
    print(f"- JSON audit: {json_path}")
    print(f"- Clean JSON audit: {clean_json_path}")


if __name__ == "__main__":
    main()
