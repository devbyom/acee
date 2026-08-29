"use client";

import React, { useState } from "react";
import { GitBranch, Hash, ShieldCheck, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MerkleNode {
  hash: string;
  type: "root" | "branch" | "leaf";
  label: string;
  data?: string;
}

export function MerkleVisualizer() {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [activeNode, setActiveNode] = useState<string>("root");

  const nodes: Record<string, MerkleNode> = {
    root: {
      hash: "0x8f2d9c44e51a94bb2098d7fa6b820a45e993bc71d4410a84e27fca240f90e512",
      type: "root",
      label: "Merkle Root (Committed to Monad)",
      data: "keccak256(Hash_Left + Hash_Right)",
    },
    branch1: {
      hash: "0x3e11a9b2c89201df8432a67749102cba8971f112e441c094a98bce41203498ac",
      type: "branch",
      label: "Intermediate Node L",
      data: "keccak256(Leaf_1 + Leaf_2)",
    },
    branch2: {
      hash: "0x994ba7823f6e91da2045ab90321ec98a0021c3b12398dcf09843a12903498edf",
      type: "branch",
      label: "Intermediate Node R",
      data: "keccak256(Leaf_3 + Leaf_4)",
    },
    leaf1: {
      hash: "0x12a8...4f92",
      type: "leaf",
      label: "Leaf 1: P2P 50 USDC",
      data: "sender: 0x9b... -> recipient: 0x4a... (Encrypted payload)",
    },
    leaf2: {
      hash: "0x44c9...89b1",
      type: "leaf",
      label: "Leaf 2: Bet 25 USDC (YES)",
      data: "market: demo-india-win (Confidential intent)",
    },
    leaf3: {
      hash: "0x77d1...03ae",
      type: "leaf",
      label: "Leaf 3: P2P 100 USDC",
      data: "sender: 0x2e... -> recipient: 0x7c... (Encrypted payload)",
    },
    leaf4: {
      hash: "0xbb82...5e41",
      type: "leaf",
      label: "Leaf 4: Bet 10 USDC (NO)",
      data: "market: demo-btc-100k (Confidential intent)",
    },
  };

  const copy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500);
  };

  return (
    <div className="border border-[#1c2026] bg-[#0d0f12] p-5 space-y-5" style={{ borderRadius: "2px" }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center bg-[#298dff]/15 text-[#298dff]" style={{ borderRadius: "2px" }}>
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-text-primary">Merkle Rollup State Tree</h3>
            <p className="text-xs text-text-secondary">Deterministic leaf aggregation committed to Monad</p>
          </div>
        </div>
        <Badge variant="default">
          <ShieldCheck className="h-3 w-3 mr-1" /> Monad Testnet Sync Active
        </Badge>
      </div>

      {/* Interactive Tree Graph */}
      <div className="border border-[#1c2026] bg-[#000000] p-4 space-y-5" style={{ borderRadius: "2px" }}>
        {/* Level 1: Root */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setActiveNode("root")}
            style={{ borderRadius: "2px" }}
            className={`flex flex-col items-center gap-1 border p-2.5 transition-all max-w-md w-full ${
              activeNode === "root"
                ? "border-[#298dff] bg-[#298dff]/15 text-[#54a6ff] shadow-[0_0_15px_rgba(41,141,255,0.3)]"
                : "border-[#1c2026] bg-[#0d0f12] text-text-secondary hover:border-[#298dff]/50"
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#298dff]">
              <Hash className="h-3 w-3" />
              <span>MERKLE ROOT (MONAD COMMITMENT)</span>
            </div>
            <span className="mono text-[10px] truncate w-full text-center">{nodes.root.hash}</span>
          </button>
          <div className="h-3 w-0.5 bg-[#298dff]/40 my-1" />
        </div>

        {/* Level 2: Intermediate Nodes */}
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
          <button
            onClick={() => setActiveNode("branch1")}
            style={{ borderRadius: "2px" }}
            className={`flex flex-col items-center gap-1 border p-2 transition-all text-center ${
              activeNode === "branch1"
                ? "border-[#298dff] bg-[#298dff]/15 text-[#54a6ff]"
                : "border-[#1c2026] bg-[#0d0f12] text-text-secondary hover:border-[#298dff]/40"
            }`}
          >
            <span className="text-[11px] font-medium text-text-primary">Branch Node L</span>
            <span className="mono text-[9px] text-text-muted truncate w-full">{nodes.branch1.hash.slice(0, 16)}...</span>
          </button>

          <button
            onClick={() => setActiveNode("branch2")}
            style={{ borderRadius: "2px" }}
            className={`flex flex-col items-center gap-1 border p-2 transition-all text-center ${
              activeNode === "branch2"
                ? "border-[#298dff] bg-[#298dff]/15 text-[#54a6ff]"
                : "border-[#1c2026] bg-[#0d0f12] text-text-secondary hover:border-[#298dff]/40"
            }`}
          >
            <span className="text-[11px] font-medium text-text-primary">Branch Node R</span>
            <span className="mono text-[9px] text-text-muted truncate w-full">{nodes.branch2.hash.slice(0, 16)}...</span>
          </button>
        </div>

        {/* Level 3: Transaction Leaves */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {["leaf1", "leaf2", "leaf3", "leaf4"].map((key) => {
            const node = nodes[key];
            return (
              <button
                key={key}
                onClick={() => setActiveNode(key)}
                style={{ borderRadius: "2px" }}
                className={`flex flex-col p-2 border transition-all text-left ${
                  activeNode === key
                    ? "border-[#298dff] bg-[#298dff]/15 text-[#54a6ff]"
                    : "border-[#1c2026] bg-[#0d0f12] text-text-secondary hover:border-[#1c2026]/80"
                }`}
              >
                <div className="flex items-center justify-between text-[9px] font-semibold text-[#298dff]">
                  <span>LEAF</span>
                  <span className="mono">#{key.replace('leaf', '')}</span>
                </div>
                <span className="text-[10px] font-medium text-text-primary mt-1 line-clamp-1">{node.label}</span>
                <span className="mono text-[9px] text-text-muted mt-0.5">{node.hash}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details */}
      {nodes[activeNode] && (
        <div className="border border-[#1c2026] bg-[#000000] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5" style={{ borderRadius: "2px" }}>
          <div className="space-y-0.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-primary">{nodes[activeNode].label}</span>
              <Badge variant="outline" className="text-[9px] capitalize">{nodes[activeNode].type}</Badge>
            </div>
            <div className="mono text-[11px] text-[#54a6ff] truncate">{nodes[activeNode].hash}</div>
            <div className="text-[10px] text-text-secondary">{nodes[activeNode].data}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => copy(nodes[activeNode].hash)}
            className="shrink-0 text-xs h-7 px-2.5"
          >
            {copiedHash === nodes[activeNode].hash ? (
              <>
                <Check className="h-3 w-3 text-[#298dff] mr-1" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" /> Copy Hash
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
