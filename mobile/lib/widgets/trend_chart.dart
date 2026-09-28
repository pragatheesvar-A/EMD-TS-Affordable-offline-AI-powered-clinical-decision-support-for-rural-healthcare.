import 'package:flutter/material.dart';

class TrendSeries {
  final String label;
  final Color color;
  final List<double> values;
  const TrendSeries({required this.label, required this.color, required this.values});
}

/// Minimal hand-rolled multi-series line chart (no third-party charting
/// package, to avoid an untestable dependency) used on the Patient
/// Timeline screen for SpO2 / heart rate / temperature trends.
class TrendChart extends StatelessWidget {
  final List<TrendSeries> series;
  final List<String> xLabels;
  final double height;

  const TrendChart({super.key, required this.series, required this.xLabels, this.height = 200});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: height,
          width: double.infinity,
          child: CustomPaint(painter: _TrendPainter(series: series, xLabels: xLabels)),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 14,
          runSpacing: 4,
          children: series
              .map(
                (s) => Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 10, height: 10, decoration: BoxDecoration(color: s.color, shape: BoxShape.circle)),
                    const SizedBox(width: 5),
                    Text(s.label, style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                  ],
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

class _TrendPainter extends CustomPainter {
  final List<TrendSeries> series;
  final List<String> xLabels;

  _TrendPainter({required this.series, required this.xLabels});

  @override
  void paint(Canvas canvas, Size size) {
    const leftPad = 8.0;
    const bottomPad = 20.0;
    final chartWidth = size.width - leftPad * 2;
    final chartHeight = size.height - bottomPad;

    double minV = double.infinity;
    double maxV = double.negativeInfinity;
    for (final s in series) {
      for (final v in s.values) {
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
    }
    if (minV == double.infinity) return;
    if (minV == maxV) {
      minV -= 5;
      maxV += 5;
    }
    final range = maxV - minV;
    final pad = range * 0.15;
    minV -= pad;
    maxV += pad;

    final gridPaint = Paint()
      ..color = const Color(0xFFEEF2F6)
      ..strokeWidth = 1;
    for (var i = 0; i <= 3; i++) {
      final y = chartHeight * i / 3;
      canvas.drawLine(Offset(leftPad, y), Offset(leftPad + chartWidth, y), gridPaint);
    }

    final maxPoints = series.map((s) => s.values.length).fold<int>(0, (a, b) => a > b ? a : b);
    if (maxPoints < 2) return;
    final stepX = chartWidth / (maxPoints - 1);

    for (final s in series) {
      if (s.values.length < 2) continue;
      final path = Path();
      for (var i = 0; i < s.values.length; i++) {
        final x = leftPad + i * stepX;
        final normalized = (s.values[i] - minV) / (maxV - minV);
        final y = chartHeight - normalized * chartHeight;
        if (i == 0) {
          path.moveTo(x, y);
        } else {
          path.lineTo(x, y);
        }
      }
      final linePaint = Paint()
        ..color = s.color
        ..strokeWidth = 2.2
        ..style = PaintingStyle.stroke
        ..strokeJoin = StrokeJoin.round
        ..strokeCap = StrokeCap.round;
      canvas.drawPath(path, linePaint);

      final dotPaint = Paint()..color = s.color;
      for (var i = 0; i < s.values.length; i++) {
        final x = leftPad + i * stepX;
        final normalized = (s.values[i] - minV) / (maxV - minV);
        final y = chartHeight - normalized * chartHeight;
        canvas.drawCircle(Offset(x, y), 2.6, dotPaint);
      }
    }

    final textStyle = TextStyle(color: Colors.grey.shade500, fontSize: 10);
    for (var i = 0; i < xLabels.length && i < maxPoints; i++) {
      final x = leftPad + i * stepX;
      final tp = TextPainter(
        text: TextSpan(text: xLabels[i], style: textStyle),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(x - tp.width / 2, chartHeight + 4));
    }
  }

  @override
  bool shouldRepaint(covariant _TrendPainter oldDelegate) => true;
}
