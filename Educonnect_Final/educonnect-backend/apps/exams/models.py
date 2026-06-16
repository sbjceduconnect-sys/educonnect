from django.db import models

class Exam(models.Model):
    TYPE_CHOICES = [
        ('Theory','Theory'),
        ('Practical','Practical'),
        ('Viva','Viva'),
        ('mid', 'mid'),
        ('final', 'final'),
        ('quiz', 'quiz'),
        ('assignment', 'assignment'),
        ('practical', 'practical'),
    ]
    title     = models.CharField(max_length=200)
    course    = models.ForeignKey('courses.Course', on_delete=models.CASCADE, related_name='exams')
    subject   = models.ForeignKey('subjects.Subject', on_delete=models.CASCADE, null=True, blank=True, related_name='exams')
    date      = models.DateField()
    duration  = models.CharField(max_length=50, blank=True)
    max_marks = models.PositiveIntegerField(default=100)
    type      = models.CharField(max_length=20, choices=TYPE_CHOICES, default='Theory')
    academic_year = models.CharField(max_length=20, blank=True)
    created_at= models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exams'
        ordering = ['date']

    def __str__(self):
        return f"{self.title} ({self.course.code})"


class Result(models.Model):
    student  = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='results')
    exam     = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    marks    = models.FloatField(default=0)
    grade    = models.CharField(max_length=5, blank=True)
    remarks  = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'results'
        unique_together = ['student', 'exam']

    def save(self, *args, **kwargs):
        pct = (self.marks / self.exam.max_marks * 100) if self.exam.max_marks else 0
        self.grade = 'A+' if pct>=90 else 'A' if pct>=80 else 'B+' if pct>=75 else 'B' if pct>=70 else 'C' if pct>=60 else 'D' if pct>=50 else 'F'
        super().save(*args, **kwargs)
