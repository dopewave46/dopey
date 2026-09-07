import { useState } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "@/components/icons/Icon";
import { Menu } from "@/components/ui/Menu";
import { formatCurrency, formatDate } from "@/utils/format";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "@/services/crmStore";
import type { Lead, LeadStage } from "@/services/types";
import styles from "./LeadKanban.module.css";

export interface LeadKanbanProps {
  leads: Lead[];
  onOpenLead: (id: string) => void;
  /** Called when a lead is moved to "won" — should open the conversion flow. */
  onWin: (lead: Lead) => void;
  onStageChange: (leadId: string, stage: LeadStage) => void;
}

export function LeadKanban({ leads, onOpenLead, onWin, onStageChange }: LeadKanbanProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<LeadStage | null>(null);

  const move = (lead: Lead, stage: LeadStage) => {
    if (lead.stage === stage) return;
    if (stage === "won" && !lead.convertedClientId) {
      onWin(lead);
      return;
    }
    onStageChange(lead.id, stage);
  };

  const handleDrop = (stage: LeadStage) => {
    const lead = leads.find((l) => l.id === dragId);
    setDragId(null);
    setOverStage(null);
    if (lead) move(lead, stage);
  };

  return (
    <div className={styles.board}>
      {LEAD_STAGE_ORDER.map((stage) => {
        const columnLeads = leads.filter((l) => l.stage === stage);
        const total = columnLeads.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0);
        return (
          <section
            key={stage}
            className={cn(
              styles.column,
              stage === "won" && styles.columnWon,
              stage === "lost" && styles.columnLost,
              overStage === stage && styles.columnOver,
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setOverStage(stage);
            }}
            onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
            onDrop={() => handleDrop(stage)}
          >
            <header className={styles.columnHead}>
              <span className={styles.columnTitle}>{LEAD_STAGE_LABELS[stage]}</span>
              <span className={styles.columnCount}>{columnLeads.length}</span>
            </header>
            {total > 0 && <div className={styles.columnValue}>{formatCurrency(total)}</div>}

            <div className={styles.cards}>
              {columnLeads.map((lead) => (
                <article
                  key={lead.id}
                  className={cn(
                    styles.card,
                    lead.stage === "lost" && styles.cardMuted,
                    dragId === lead.id && styles.cardDragging,
                  )}
                  draggable
                  onDragStart={() => setDragId(lead.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverStage(null);
                  }}
                  onClick={() => onOpenLead(lead.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onOpenLead(lead.id);
                  }}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardBusiness}>{lead.business || lead.name}</span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Menu
                        align="end"
                        items={[
                          { label: "Open lead", icon: "arrow-right", onSelect: () => onOpenLead(lead.id) },
                          ...LEAD_STAGE_ORDER.filter((s) => s !== lead.stage).map((s) => ({
                            label: `Move to ${LEAD_STAGE_LABELS[s]}`,
                            onSelect: () => move(lead, s),
                            divided: s === "new",
                          })),
                        ]}
                        trigger={(props) => (
                          <button type="button" className={styles.cardMenuBtn} aria-label="Lead actions" {...props}>
                            <Icon name="more" size={16} />
                          </button>
                        )}
                      />
                    </div>
                  </div>
                  {lead.business && <span className={styles.cardContact}>{lead.name}</span>}
                  <div className={styles.cardMeta}>
                    {lead.estimatedValue ? (
                      <span className={styles.cardValue}>{formatCurrency(lead.estimatedValue)}</span>
                    ) : (
                      <span className={styles.cardValueMuted}>No estimate</span>
                    )}
                    {lead.followUpDate && (
                      <span className={styles.cardFollowUp}>
                        <Icon name="calendar" size={12} weight={2} />
                        {formatDate(lead.followUpDate)}
                      </span>
                    )}
                  </div>
                </article>
              ))}
              {columnLeads.length === 0 && <p className={styles.columnEmpty}>Drop leads here</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
