from django.shortcuts import render


def get_homepage(request):
    return render(request, 'pages/index.html')
