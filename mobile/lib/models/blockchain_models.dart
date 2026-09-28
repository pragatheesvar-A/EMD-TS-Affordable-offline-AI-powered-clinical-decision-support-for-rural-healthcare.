class BlockchainTransaction {
  final String txId;
  final String type;
  final String patientId;
  final String userRole;
  final String action;
  final String recordHash;
  final String timestamp;
  final int recordVersion;
  final int blockIndex;
  final String blockHash;

  const BlockchainTransaction({
    required this.txId,
    required this.type,
    required this.patientId,
    required this.userRole,
    required this.action,
    required this.recordHash,
    required this.timestamp,
    required this.recordVersion,
    required this.blockIndex,
    required this.blockHash,
  });

  factory BlockchainTransaction.fromJson(Map<String, dynamic> json) {
    return BlockchainTransaction(
      txId: json['txId'] as String,
      type: json['type'] as String,
      patientId: json['patientId'] as String,
      userRole: json['userRole'] as String,
      action: json['action'] as String,
      recordHash: json['recordHash'] as String? ?? '',
      timestamp: json['timestamp'] as String,
      recordVersion: (json['recordVersion'] as num?)?.toInt() ?? 1,
      blockIndex: (json['blockIndex'] as num?)?.toInt() ?? 0,
      blockHash: json['blockHash'] as String? ?? '',
    );
  }
}

class SyncQueueItem {
  final String id;
  final String patientId;
  final String description;
  final String createdAt;
  final bool synced;

  const SyncQueueItem({
    required this.id,
    required this.patientId,
    required this.description,
    required this.createdAt,
    required this.synced,
  });

  factory SyncQueueItem.fromJson(Map<String, dynamic> json) {
    return SyncQueueItem(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      description: json['description'] as String,
      createdAt: json['createdAt'] as String,
      synced: json['synced'] as bool? ?? false,
    );
  }
}

class IntegrityStatus {
  final String patientId;
  final String originalHash;
  final String currentHash;
  final bool verified;
  final bool tampered;

  const IntegrityStatus({
    required this.patientId,
    required this.originalHash,
    required this.currentHash,
    required this.verified,
    required this.tampered,
  });

  factory IntegrityStatus.fromJson(Map<String, dynamic> json) {
    return IntegrityStatus(
      patientId: json['patientId'] as String,
      originalHash: json['originalHash'] as String? ?? '',
      currentHash: json['currentHash'] as String? ?? '',
      verified: json['verified'] as bool? ?? true,
      tampered: json['tampered'] as bool? ?? false,
    );
  }
}
